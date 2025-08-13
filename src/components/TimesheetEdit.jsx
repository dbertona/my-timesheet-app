// src/components/TimesheetEdit.jsx
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
  const [hasDailyErrors, setHasDailyErrors] = useState(false);

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
  function toIsoFromInput(value) {
    if (!value) return null;
    if (typeof value === "string" && value.includes("/")) {
      const [dd, mm, yyyy] = value.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    // fallback: assume ISO or Date string
    return String(value).slice(0, 10);
  }
  function toDisplayDate(value) {
    if (!value) return "";
    const s = String(value);
    // Already in dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // Try ISO YYYY-MM-DD or take first 10 chars
    const iso = s.slice(0, 10);
    const [y, m, d] = iso.split("-");
    if (y && m && d) {
      try {
        return format(new Date(Number(y), Number(m) - 1, Number(d)), "dd/MM/yyyy");
      } catch (_) {
        return "";
      }
    }
    return "";
  }

  const [debugInfo, setDebugInfo] = useState({ ap: null, headerIdProp: headerId ?? null, headerIdResolved: null });
  const [resolvedHeaderId, setResolvedHeaderId] = useState(null);
  const effectiveHeaderId = useMemo(
    () => resolvedHeaderId ?? header?.id ?? headerId ?? null,
    [resolvedHeaderId, header?.id, headerId]
  );

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
            date: toDisplayDate(line.date),
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
        } else if (requiredHours > 0) {
          if (got >= (requiredHours - EPS)) status = "completo"; // verde
          else if (got > 0)                status = "parcial";  // amarillo
          else                              status = "cero";     // rojo
        }

        arr.push({ d, iso, need: requiredHours, got, status });
      }
      setCalendarDays(arr);
    }

    buildCalendar();
  }, [header, resolvedHeaderId]);

  // === Actualizar colores del calendario en vivo según ediciones locales (sin grabar)
  useEffect(() => {
    if (!calRange?.year || !calRange?.month) return;

    const EPS = 0.01;
    // Festivos (solo estos van en gris)
    const holidaySet = new Set((calendarHolidays || []).map((h) => (h.day || "").slice(0, 10)));

    // Horas imputadas "en vivo" desde el formulario (editFormData)
    const liveImp = {};
    Object.values(editFormData || {}).forEach((row) => {
      const iso = toIsoFromInput(row?.date);
      if (!iso) return;
      const q = Number(row?.quantity) || 0;
      liveImp[iso] = (liveImp[iso] || 0) + q;
    });

    // Construir arreglo de días con estado (usando dailyRequired + liveImp)
    const arr = [];
    const totalDays = daysInMonth(calRange.year, calRange.month);
    for (let d = 1; d <= totalDays; d++) {
      const iso = isoOf(calRange.year, calRange.month, d);
      const need = dailyRequired?.[iso] ?? 0;
      const got = liveImp?.[iso] ?? 0;

      let status = "neutral";
      if (holidaySet.has(iso)) {
        status = "sin-horas";           // festivo → gris
      } else if (need > 0) {
        if (got >= (need - EPS)) status = "completo"; // verde
        else if (got > 0)        status = "parcial";  // amarillo
        else                      status = "cero";     // rojo
      }

      arr.push({ d, iso, need, got, status });
    }

    setCalendarDays(arr);
  }, [editFormData, dailyRequired, calRange, calendarHolidays]);

  // === Validación en vivo: tope diario y festivos (no permitir imputar)
  useEffect(() => {
    // Necesitamos rangos y requeridas cargadas
    if (!calRange?.year || !calRange?.month) return;
    const hasReq = dailyRequired && Object.keys(dailyRequired).length > 0;
    if (!hasReq) return; // evitar poner cantidades a 0 antes de tener requeridas

    // 1) Conjunto de festivos (solo estos bloquean por gris)
    const holidaySet = new Set((calendarHolidays || []).map((h) => (h.day || "").slice(0, 10)));

    // 2) Requeridas por día
    const req = dailyRequired || {};

    // 3) Totales por día desde el formulario
    const totals = {};
    for (const row of Object.values(editFormData || {})) {
      const iso = toIsoFromInput(row?.date);
      if (!iso) continue;
      totals[iso] = (totals[iso] || 0) + (Number(row?.quantity) || 0);
    }

    // 4) Construir mapa de errores por línea y normalizar cantidades inválidas en festivo
    const nextErrors = {};
    let changedSomething = false;
    const nextEdit = { ...editFormData };

    for (const [id, row] of Object.entries(editFormData || {})) {
      const iso = toIsoFromInput(row?.date);
      if (!iso) continue;
      const required = Number(req[iso] || 0);
      const isHoliday = holidaySet.has(iso);
      const qNum = Number(row?.quantity) || 0;

      if (isHoliday) {
        // Festivo: no permitir imputar
        if (qNum > 0) {
          // autocorregimos a 0
          nextEdit[id] = { ...row, quantity: 0 };
          changedSomething = true;
          nextErrors[id] = { ...(nextErrors[id] || {}), quantity: "Día festivo: no se permiten horas" };
        } else {
          nextErrors[id] = { ...(nextErrors[id] || {}), quantity: "Día festivo: no se permiten horas" };
        }
        continue; // no más validaciones sobre festivos
      }

      if (required <= 0) {
        // Día sin horas requeridas: no permitir imputar
        if (qNum > 0) {
          nextEdit[id] = { ...row, quantity: 0 };
          changedSomething = true;
        }
        nextErrors[id] = { ...(nextErrors[id] || {}), quantity: "Día sin horas requeridas: no se permiten horas" };
        continue;
      }

      // Exceso sobre tope diario: marcar todas las líneas de ese día
      const totalForDay = Number(totals[iso] || 0);
      const EPS = 0.01;
      if (totalForDay > required + EPS) {
        nextErrors[id] = { ...(nextErrors[id] || {}), quantity: `Excede tope diario (${totalForDay.toFixed(2)} / ${required.toFixed(2)})` };
      }
    }

    if (changedSomething) {
      setEditFormData(nextEdit);
    }

    setErrors(nextErrors);
    setHasDailyErrors(Object.keys(nextErrors).length > 0);
  }, [editFormData, dailyRequired, calendarHolidays, calRange]);

  // -- Sincronizar estado de edición desde `lines` solo cuando cambian de verdad
  useEffect(() => {
    const safe = Array.isArray(lines) ? lines : [];
    // Firma basada SOLO en los IDs de las líneas para detectar altas/bajas, no cambios de contenido
    const idsSig = JSON.stringify(safe.map((l) => String(l.id)).sort());
    if (prevLinesSigRef.current === idsSig) return;
    prevLinesSigRef.current = idsSig;

    setEditFormData((prev) => {
      const next = { ...prev };

      // Conjunto de IDs actuales en `lines`
      const currentIds = new Set(safe.map((l) => String(l.id)));

      // 1) Agregar líneas nuevas que aún no estén en `editFormData` (NO sobrescribe las existentes)
      for (const l of safe) {
        const id = String(l.id);
        if (!(id in next)) {
          next[id] = {
            ...l,
            date: toDisplayDate(l.date),
          };
        }
      }

      // 2) (Opcional) Eliminar de `editFormData` las líneas que ya no existen en `lines`
      for (const id of Object.keys(next)) {
        if (!currentIds.has(String(id))) {
          delete next[id];
        }
      }

      return next;
    });
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
      header_id: effectiveHeaderId,
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
        out.header_id = effectiveHeaderId;
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
      } else if (key === "quantity") {
        out.quantity = Number(row.quantity) || 0;
      } else {
        out[key] = row[key] ?? null;
      }
    }
    return out;
  };

  // -- Festivos: obtener lista de fechas ISO (YYYY-MM-DD) de los festivos
  const festivos = useMemo(
    () => (calendarHolidays || []).map((h) => (h.day || "").slice(0, 10)),
    [calendarHolidays]
  );

  // -- Hook de edición (modificado para interceptar cambios de fecha/cantidad)
  const {
    inputRefs,
    calendarOpenFor,
    setCalendarOpenFor,
    handleInputChange: origHandleInputChange,
    handleDateInputChange: origHandleDateInputChange, // NO usado directamente
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

  // -- Router de cambios por campo: deriva quantity/date a sus handlers y el resto al handler original
  const handleInputChange = (id, eOrPatch) => {
    const target = eOrPatch && eOrPatch.target ? eOrPatch.target : {};
    const name = target.name;
    const value = target.value;

    if (name === "quantity") {
      handleQuantityChange(id, value);
      return;
    }
    if (name === "date") {
      handleDateChange(id, value);
      return;
    }
    // Por defecto, usar el handler del hook para los demás campos
    origHandleInputChange(id, eOrPatch);
  };

  // -- Custom handleDateChange
  const handleDateChange = (id, value) => {
    // value puede ser "dd/MM/yyyy" o similar
    const iso = toIsoFromInput(value);
    if (festivos.includes(iso)) {
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          date: value,
          quantity: 0,
          isHoliday: true,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), quantity: "Día festivo: no se permiten horas" },
      }));
      return;
    }
    // Si no es festivo, limpiar isHoliday y error.quantity
    setEditFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        date: value,
        isHoliday: false,
      },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      const e = { ...(next[id] || {}) };
      delete e.quantity;
      if (Object.keys(e).length === 0) delete next[id];
      else next[id] = e;
      return next;
    });
  };

  // -- Custom handleQuantityChange
  const handleQuantityChange = (id, value) => {
    const row = editFormData[id] || {};
    const iso = toIsoFromInput(row?.date);
    // Si la fila es festivo (por isHoliday o porque la fecha está en festivos)
    if (row?.isHoliday || festivos.includes(iso)) {
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: 0,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), quantity: "Día festivo: no se permiten horas" },
      }));
      return;
    }
    // Validación de tope diario
    // Sumar todas las quantities de la fecha (incluyendo la edición actual)
    let total = 0;
    for (const [lid, lrow] of Object.entries(editFormData)) {
      if (lid === id) {
        total += Number(value) || 0;
      } else {
        const liso = toIsoFromInput(lrow?.date);
        if (liso === iso) total += Number(lrow?.quantity) || 0;
      }
    }
    const required = dailyRequired?.[iso] ?? 0;
    const EPS = 0.01;
    if (required > 0 && total > required + EPS) {
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), quantity: `Excede tope diario (${total.toFixed(2)} / ${required.toFixed(2)})` },
      }));
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: value,
        },
      }));

      // 👇 Mantener foco en la misma celda de Cantidad
      const el = inputRefs?.current?.[id]?.["quantity"];
      if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);

      return;
    }
    // Si todo ok, actualizar normalmente
    setEditFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity: value,
      },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      const e = { ...(next[id] || {}) };
      delete e.quantity;
      if (Object.keys(e).length === 0) delete next[id];
      else next[id] = e;
      return next;
    });
  };

  // -- Guardar cambios
  const saveAllEdits = async () => {
    if (hasDailyErrors) {
      alert("Corrige los errores diarios (festivos o tope superado) antes de guardar.");
      return;
    }
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
      .eq("header_id", effectiveHeaderId);

    if (refreshErr) {
      console.error("Error refrescando líneas:", refreshErr);
      return;
    }

    if (linesData) {
      linesData.sort((a, b) => new Date(a.date) - new Date(b.date));
      const linesFormatted = linesData.map((line) => ({
        ...line,
        date: toDisplayDate(line.date),
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
                let backgroundColor;
                switch (day.status) {
                  case "sin-horas":
                    backgroundColor = "lightgray"; // festivo
                    break;
                  case "cero":
                    backgroundColor = "red"; // requerido y 0 imputado
                    break;
                  case "parcial":
                    backgroundColor = "yellow"; // requerido y >0 pero < requerido
                    break;
                  case "completo":
                    backgroundColor = "lightgreen"; // suficiente
                    break;
                  default:
                    backgroundColor = undefined; // sin color especial
                }
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
                        backgroundColor,
                        background: backgroundColor,
                        color:
                          backgroundColor === "yellow" || backgroundColor === "lightgray"
                            ? "#222"
                            : backgroundColor
                            ? "#fff"
                            : "inherit",
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-around",
                gap: "6px",
                marginTop: "8px",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                <span style={{ width: "12px", height: "12px", backgroundColor: "red", borderRadius: "3px" }}></span>
                Sin Horas
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                <span style={{ width: "12px", height: "12px", backgroundColor: "yellow", borderRadius: "3px" }}></span>
                Parcial
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                <span style={{ width: "12px", height: "12px", backgroundColor: "lightgreen", borderRadius: "3px" }}></span>
                Completo
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                <span style={{ width: "12px", height: "12px", backgroundColor: "lightgray", borderRadius: "3px" }}></span>
                Festivo
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sección de líneas debajo, ocupa todo el ancho */}
      <div style={{ marginTop: 24 }}>
        <h3>Líneas</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={saveAllEdits} disabled={hasDailyErrors} title={hasDailyErrors ? "Corrige los errores diarios (festivos o tope superado)" : ""}>
            Guardar todos
          </button>
        </div>
        <TimesheetLines
          lines={lines}
          editFormData={editFormData}
          errors={errors}
          inputRefs={inputRefs}
          calendarOpenFor={calendarOpenFor}
          setCalendarOpenFor={setCalendarOpenFor}
          handleInputChange={handleInputChange}
          handleDateInputChange={handleDateChange}
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
