import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { supabaseClient } from "../supabaseClient";
import { format } from "date-fns";
import TimesheetHeader from "./TimesheetHeader";
import TimesheetLines from "./TimesheetLines";
import useTimesheetEdit from "../hooks/useTimesheetEdit";

// ✅ columnas existentes en la tabla 'timesheet'
const SAFE_COLUMNS = [
  "header_id",
  "job_no",
  "job_task_no",
  "description",
  "work_type",
  "quantity",
  "date",
  "department_code",
  "company",
  "creado",
  "job_no_and_description",
  "job_responsible",
  "job_responsible_approval", // siempre true
  "resource_no",              // NUEVO
  "resource_responsible",     // NUEVO
];

function TimesheetEdit({ headerId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [header, setHeader] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [calendarHolidays, setCalendarHolidays] = useState([]);

  // === Calendario (estado + helpers)
  const [calendarDays, setCalendarDays] = useState([]); // [{ d, iso, need, got, status }]
  const [dailyRequired, setDailyRequired] = useState({}); // { 'YYYY-MM-DD': hours }
  const [dailyImputed, setDailyImputed] = useState({}); // { 'YYYY-MM-DD': hours }
  const [calRange, setCalRange] = useState({ year: null, month: null }); // month: 1-12
  const [firstOffset, setFirstOffset] = useState(0); // lunes=0..domingo=6

  function parseAllocationPeriod(ap) {
    const m = /^M(\d{2})-M(\d{2})$/.exec(ap || "");
    if (!m) return null;
    const yy = parseInt(m[1], 10);
    const year = 2000 + yy;
    const month = parseInt(m[2], 10); // 1..12
    return { year, month };
  }
  function daysInMonth(year, month) { // month: 1..12
    return new Date(year, month, 0).getDate();
  }
  function isoOf(y, m, d) {
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  const [debugInfo, setDebugInfo] = useState({ ap: null, headerIdProp: headerId ?? null, headerIdResolved: null });
  const [resolvedHeaderId, setResolvedHeaderId] = useState(null);

  const prevLinesSigRef = useRef("");

  // -- Carga inicial (por headerId o por allocation_period del mes actual)
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 0) Construir allocation_period desde query o por defecto (mes actual)
      const params = new URLSearchParams(location.search);
      let ap = params.get("allocation_period");
      if (!ap) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2); // "25"
        const mm = String(now.getMonth() + 1).padStart(2, "0"); // "08"
        ap = `M${yy}-M${mm}`; // p.ej. M25-M08
      }

      // 1) Resolver header a cargar
      let headerData = null;
      let headerIdResolved = headerId || null;

      if (headerIdResolved) {
        const { data: h, error: headerErr } = await supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("id", headerIdResolved)
          .single();
        if (headerErr) console.error("Error cargando cabecera:", headerErr);
        headerData = h || null;
      } else {
        // Buscar por allocation_period exacto
        const { data: h, error: headerErr } = await supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("allocation_period", ap)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (headerErr) console.error("Error cargando cabecera por allocation_period:", headerErr);
        headerData = h || null;
        headerIdResolved = headerData?.id || null;
      }

      setHeader(headerData);
      setResolvedHeaderId(headerIdResolved);
      setDebugInfo({ ap, headerIdProp: headerId ?? null, headerIdResolved });

      // 2) Cargar líneas si tenemos cabecera
      if (headerIdResolved) {
        const { data: linesData, error: linesErr } = await supabaseClient
          .from("timesheet")
          .select("*")
          .eq("header_id", headerIdResolved);
        if (linesErr) console.error("Error cargando líneas:", linesErr);

        if (linesData) {
          linesData.sort((a, b) => new Date(a.date) - new Date(b.date));
          const linesFormatted = linesData.map((line) => ({
            ...line,
            date: line.date ? format(new Date(line.date), "dd/MM/yyyy") : "",
          }));
          setLines(linesFormatted);
        } else {
          setLines([]);
        }
      } else {
        // Si no encontramos cabecera, limpiamos líneas
        setLines([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [headerId, location.search]);

  // === Construir datos para el calendario (requerido vs imputado por día)
  useEffect(() => {
    async function buildCalendar() {
      if (!header) return;
      const apInfo = parseAllocationPeriod(header.allocation_period);
      if (!apInfo) return;
      const { year, month } = apInfo;
      setCalRange({ year, month });

      const first = new Date(year, month - 1, 1);
      const js = first.getDay(); // 0=Dom .. 6=Sáb
      const offset = (js + 6) % 7; // Lunes=0 .. Domingo=6
      setFirstOffset(offset);

      // Resolver código de calendario desde la cabecera (fallbacks)
      const calendarCode = header?.resource_calendar ?? header?.calendar_code ?? header?.calendar_type ?? null;
      if (!calendarCode) {
        console.warn("No calendar code found in header (resource_calendar/calendar_code/calendar_type)");
        setCalendarDays([]);
        return;
      }

      const fromIso = isoOf(year, month, 1);
      const toIso = isoOf(year, month, daysInMonth(year, month));

      // 1) Horas requeridas por día del calendario laboral
      const { data: calRows, error: calErr } = await supabaseClient
        .from("calendar_period_days")
        .select("day,hours_working,holiday")
        .eq("allocation_period", header.allocation_period)
        .eq("calendar_code", calendarCode);
      if (calErr) {
        console.error("Error cargando calendar_period_days:", calErr);
        return;
      }
      const req = {};
      (calRows || []).forEach((r) => {
        const iso = (r.day || "").slice(0, 10);
        req[iso] = Number(r.hours_working) || 0;
      });
      setDailyRequired(req);

      // 2) Horas imputadas por día (sumando quantity de lines del header)
      const { data: tRows, error: tErr } = await supabaseClient
        .from("timesheet")
        .select("date,quantity")
        .eq("header_id", resolvedHeaderId || header.id)
        .gte("date", fromIso)
        .lte("date", toIso);
      if (tErr) {
        console.error("Error cargando imputaciones:", tErr);
        return;
      }
      const imp = {};
      (tRows || []).forEach((r) => {
        const iso = (r.date || "").slice(0, 10);
        const q = Number(r.quantity) || 0;
        imp[iso] = (imp[iso] || 0) + q;
      });
      setDailyImputed(imp);

      // 3) Construir arreglo de días con estado usando festivos, solo festivos en gris
      const EPS = 0.01;
      // Construir holidaySet (solo festivos en el calendario)
      const holidaySet = new Set();
      (calRows || []).forEach((day) => {
        const iso = (day.day || "").slice(0, 10);
        if (day.holiday === true) {
          holidaySet.add(iso);
        }
      });

      const arr = [];
      const totalDays = daysInMonth(year, month);
      for (let d = 1; d <= totalDays; d++) {
        const iso = isoOf(year, month, d);
        const requiredHours = req[iso] ?? 0;
        const got = imp[iso] ?? 0;

        let status = "neutral";
        if (holidaySet.has(iso)) {
          status = "sin-horas"; // solo festivos en gris
        } else if (got >= (requiredHours - EPS)) {
          status = "completo"; // completo con tolerancia
        } else {
          status = "falta";    // faltan horas
        }

        arr.push({ d, iso, need: requiredHours, got, status });
      }
      setCalendarDays(arr);
    }

    buildCalendar();
  }, [header, resolvedHeaderId]);

  // -- Sincronizar estado de edición desde `lines` solo cuando cambian de verdad
  useEffect(() => {
    const safe = Array.isArray(lines) ? lines : [];
    const sig = JSON.stringify(
      safe.map((l) => ({
        id: l.id,
        job_no: l.job_no ?? "",
        job_task_no: l.job_task_no ?? "",
        description: l.description ?? "",
        work_type: l.work_type ?? "",
        quantity: l.quantity ?? "",
        date: l.date ?? "",
        department_code: l.department_code ?? "",
        company: l.company ?? "",
        resource_no: l.resource_no ?? "",
      }))
    );
    if (prevLinesSigRef.current === sig) return;
    prevLinesSigRef.current = sig;

    const map = {};
    for (const l of safe) {
      map[l.id] = { ...l };
    }
    setEditFormData(map);
  }, [lines]);

  // -- Festivos
  useEffect(() => {
    async function fetchHolidays() {
      if (!header) return;
      const calendarCode = header?.resource_calendar ?? header?.calendar_code ?? header?.calendar_type ?? null;
      if (!calendarCode) return;
      const { data, error } = await supabaseClient
        .from("calendar_period_days")
        .select("*")
        .eq("allocation_period", header?.allocation_period)
        .eq("calendar_code", calendarCode)
        .eq("holiday", true);
      if (error) console.error("Error cargando festivos:", error);
      setCalendarHolidays(data || []);
    }
    fetchHolidays();
  }, [header]);

  // -- Crear nueva línea local
  const addEmptyLine = () => {
    const newId = `tmp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newLine = {
      id: newId,
      header_id: headerId,
      job_no: "",
      job_task_no: "",
      description: "",
      work_type: "",
      quantity: 0,
      date: "",
      department_code: header?.department_code || "",
      company: header?.company || "",
      creado: nowIso,
      job_no_and_description: "",
      job_responsible: "",
      job_responsible_approval: true, // siempre TRUE
      resource_no: header?.resource_no || "",
      resource_responsible: header?.resource_no || "", // fallback razonable
    };

    setLines((prev) => [...prev, newLine]);
    setEditFormData((prev) => ({
      ...prev,
      [newId]: { ...newLine },
    }));

    return newId;
  };

  // -- Buscar responsables de job
  const fetchJobResponsibles = async (jobNos) => {
    if (!jobNos || jobNos.length === 0) return {};
    const unique = Array.from(new Set(jobNos.filter(Boolean)));
    if (unique.length === 0) return {};
    const { data, error } = await supabaseClient
      .from("job")
      .select("no,responsible")
      .in("no", unique);
    if (error) {
      console.error("Error buscando responsables de job:", error);
      return {};
    }
    const map = {};
    for (const r of data) {
      map[r.no] = r.responsible ?? "";
    }
    return map;
  };

  // -- Preparar datos para DB
  const prepareRowForDb = (row, jobResponsibleMap) => {
    const out = {};
    for (const key of SAFE_COLUMNS) {
      if (key === "date") {
        if (row.date) {
          const [dd, mm, yyyy] = row.date.split("/");
          out.date = `${yyyy}-${mm}-${dd}`;
        } else {
          out.date = null;
        }
      } else if (key === "header_id") {
        out.header_id = headerId;
      } else if (key === "company") {
        out.company = header?.company ?? row.company ?? "";
      } else if (key === "creado") {
        out.creado = row.creado ?? new Date().toISOString();
      } else if (key === "job_no_and_description") {
        const j = row.job_no || "";
        const d = row.description || "";
        out.job_no_and_description = (j && d) ? `${j} - ${d}` : `${j}${d}`;
      } else if (key === "job_responsible") {
        const jobNo = row.job_no || "";
        const resolved = jobResponsibleMap?.[jobNo];
        out.job_responsible = resolved ?? row.job_responsible ?? "";
      } else if (key === "job_responsible_approval") {
        out.job_responsible_approval = true; // forzar TRUE
      } else if (key === "resource_no") {
        out.resource_no = row.resource_no ?? header?.resource_no ?? "";
      } else if (key === "resource_responsible") {
        out.resource_responsible = row.resource_responsible ?? header?.resource_no ?? "";
      } else {
        out[key] = row[key] ?? null;
      }
    }
    return out;
  };

  // -- Hook de edición
  const {
    inputRefs,
    calendarOpenFor,
    setCalendarOpenFor,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleInputFocus,
    handleKeyDown,
  } = useTimesheetEdit({
    header,
    lines,
    editFormData,
    setEditFormData,
    setErrors,
    calendarHolidays,
    addEmptyLine,
  });

  // -- Guardar cambios
  const saveAllEdits = async () => {
    let errorOccurred = false;
    const ids = Object.keys(editFormData);
    const toInsertIds = ids.filter((id) => String(id).startsWith("tmp-"));
    const toUpdateIds = ids.filter((id) => !String(id).startsWith("tmp-"));

    const allRowsToSave = [...toInsertIds, ...toUpdateIds].map((id) => editFormData[id] || {});
    const jobNosNeeded = allRowsToSave
      .filter((r) => (r.job_responsible == null || r.job_responsible === "") && r.job_no)
      .map((r) => r.job_no);

    const jobResponsibleMap = await fetchJobResponsibles(jobNosNeeded);

    // INSERT
    if (toInsertIds.length > 0) {
      const rowsToInsert = toInsertIds.map((id) => prepareRowForDb(editFormData[id], jobResponsibleMap));
      const { error: insertErr } = await supabaseClient.from("timesheet").insert(rowsToInsert);
      if (insertErr) {
        console.error("Error insertando nuevas líneas:", insertErr);
        errorOccurred = true;
      }
    }

    // UPDATE
    for (const id of toUpdateIds) {
      const row = prepareRowForDb(editFormData[id], jobResponsibleMap);
      const { error } = await supabaseClient.from("timesheet").update(row).eq("id", id);
      if (error) {
        console.error(`Error actualizando línea ${id}:`, error);
        errorOccurred = true;
      }
    }

    if (errorOccurred) {
      alert("Hubo errores al guardar. Revisa la consola.");
      return;
    }

    alert("Todas las líneas se han guardado correctamente.");

    // Refrescar
    const { data: linesData, error: refreshErr } = await supabaseClient
      .from("timesheet")
      .select("*")
      .eq("header_id", headerId);

    if (refreshErr) {
      console.error("Error refrescando líneas:", refreshErr);
      return;
    }

    if (linesData) {
      linesData.sort((a, b) => new Date(a.date) - new Date(b.date));
      const linesFormatted = linesData.map((line) => ({
        ...line,
        date: line.date ? format(new Date(line.date), "dd/MM/yyyy") : "",
      }));
      setLines(linesFormatted);

      const initialEditData = {};
      linesFormatted.forEach((line) => {
        initialEditData[line.id] = { ...line };
      });
      setEditFormData(initialEditData);
    }
  };

  if (loading) return <div>Cargando datos...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {/* Botón circular solo con el icono */}
        <button
          type="button"
          aria-label="Lista Parte Trabajo"
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#D8EEF1"; // hover suave
            e.currentTarget.style.borderColor = "#007E87";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#EAF7F9";
            e.currentTarget.style.borderColor = "rgba(0,126,135,0.35)";
          }}
          style={{
            width: 36,
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            border: "1px solid rgba(0,126,135,0.35)",
            background: "#EAF7F9",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 6L9 12L15 18" stroke="#007E87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Etiqueta clickable con el mismo color del botón Editar, modificado a color negro */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Ir a lista de parte de trabajo"
          style={{
            background: "transparent",
            border: "none",
            color: "#000",
            fontWeight: 700,
            fontSize: "22px",
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Lista Parte Trabajo
        </button>
      </div>
      {/* Header y calendario: calendario flotante a la derecha, sin ocupar ancho de líneas */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        {/* Header ocupa todo el ancho, con padding a la derecha para no quedar debajo del calendario */}
        <div style={{ paddingRight: 234 }}>
          <TimesheetHeader header={header} />
        </div>

        {/* Calendario compacto ABSOLUTO a la derecha */}
        <div style={{ width: "210px", position: "absolute", top: 0, right: 24 }}>
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 12, background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {calRange.month ? `${String(calRange.month).padStart(2, "0")}/${calRange.year}` : "Mes"}
            </div>
            {/* Cabecera de días L-M-X-J-V-S-D */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                fontSize: 12,
                color: "#666",
                marginBottom: 6,
              }}
            >
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} style={{ textAlign: "center" }}>{d}</div>
              ))}
            </div>
            {/* Celdas del mes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {Array.from({ length: firstOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {calendarDays.map((day) => {
                let bg = "#f0f0f0"; // gris por defecto
                if (day.status === "completo" || day.status === "ok") bg = "#2e7d32"; // verde
                else if (day.status === "falta" || day.status === "missing") bg = "#e53935"; // rojo
                else if (day.status === "sin-horas" || day.status === "neutral") bg = "#f0f0f0"; // gris
                return (
                  <div
                    key={day.iso}
                    style={{ textAlign: "center" }}
                    title={`${day.iso} • Req: ${day.need} • Imp: ${day.got}`}
                  >
                    <div
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "3px 0",
                        borderRadius: 5,
                        background: bg,
                        color: day.status === "sin-horas" ? "#333" : "#fff",
                        fontSize: 11,
                        lineHeight: 1.2,
                      }}
                    >
                      {day.d}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Leyenda */}
            <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 11, color: "#555", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, background: "#e53935", borderRadius: 3 }} /> Falta
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, background: "#2e7d32", borderRadius: 3 }} /> Completo
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, background: "#f0f0f0", borderRadius: 3 }} /> Sin horas
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Sección de líneas debajo, ocupa todo el ancho */}
      <div style={{ marginTop: 24 }}>
        <h3>Líneas</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={saveAllEdits}>Guardar todos</button>
        </div>
        <TimesheetLines
          lines={lines}
          editFormData={editFormData}
          errors={errors}
          inputRefs={inputRefs}
          calendarOpenFor={calendarOpenFor}
          setCalendarOpenFor={setCalendarOpenFor}
          handleInputChange={handleInputChange}
          handleDateInputChange={handleDateInputChange}
          handleDateInputBlur={handleDateInputBlur}
          handleInputFocus={handleInputFocus}
          handleKeyDown={handleKeyDown}
          header={header}
          calendarHolidays={calendarHolidays}
        />
      </div>
    </div>
  );
}

export default TimesheetEdit;
