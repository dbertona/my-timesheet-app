// src/components/TimesheetEdit.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { supabaseClient } from "../supabaseClient";
import toast from "react-hot-toast";
import "../styles/HomeDashboard.css";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  const calendarBoxRef = useRef(null);
  const [rightPad, setRightPad] = useState(234); // ancho calendario + separación derecha
  const [calendarHeight, setCalendarHeight] = useState(0);

  // === Calendario (estado + helpers)
  const [calendarDays, setCalendarDays] = useState([]); // [{ d, iso, need, got, status }]
  const [dailyRequired, setDailyRequired] = useState({}); // { 'YYYY-MM-DD': hours }
  const [dailyImputed, setDailyImputed] = useState({}); // { 'YYYY-MM-DD': hours }
  const [calRange, setCalRange] = useState({ year: null, month: null }); // month: 1-12
  const [firstOffset, setFirstOffset] = useState(0); // lunes=0..domingo=6
  const [hasDailyErrors, setHasDailyErrors] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

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

  const toTwoDecimalsString = (value) => {
    if (value === null || value === undefined || value === "") return "0.00";
    const num = Number(value);
    if (!isFinite(num)) return "0.00";
    return Math.max(0, num).toFixed(2);
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 5) return "Guardado ahora";
    if (secs < 60) return `Guardado hace ${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `Guardado hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `Guardado hace ${hrs}h`;
  };

  // Pequeño componente para mostrar totales del mes dentro del panel del calendario
  const TotalsForMonth = ({ dailyRequired, editFormData }) => {
    const required = Object.values(dailyRequired || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    let imputed = 0;
    for (const row of Object.values(editFormData || {})) {
      imputed += Number(row?.quantity) || 0;
    }
    const missing = Math.max(0, required - imputed);
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Requeridas</span>
          <strong>{required.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Imputadas</span>
          <strong>{imputed.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Faltan</span>
          <strong>{missing.toFixed(2)}</strong>
        </div>
      </div>
    );
  };

  const [debugInfo, setDebugInfo] = useState({ ap: null, headerIdProp: headerId ?? null, headerIdResolved: null });
  const [resolvedHeaderId, setResolvedHeaderId] = useState(null);
  const effectiveHeaderId = useMemo(
    () => resolvedHeaderId ?? header?.id ?? headerId ?? null,
    [resolvedHeaderId, header?.id, headerId]
  );

  const prevLinesSigRef = useRef("");
  const autosaveTimersRef = useRef({}); // { [lineId]: timeoutId }

  // -- Carga inicial (por headerId o por allocation_period del mes actual)
  useEffect(() => {
    // Medir ancho/alto del calendario para alinear y reservar espacio
    const updateRightPad = () => {
      try {
        const el = calendarBoxRef.current;
        const w = el ? el.offsetWidth : 0;
        // Margen de seguridad adicional para evitar solapamiento visual con la tabla
        const SAFE_GAP_RIGHT = 36; // 24 de separación + 12 extra
        setRightPad((w || 0) + SAFE_GAP_RIGHT);
        const h = el ? el.offsetHeight : 0;
        setCalendarHeight(h || 0);
      } catch (_) {}
    };
    updateRightPad();
    window.addEventListener("resize", updateRightPad);
    let ro;
    if (window.ResizeObserver && calendarBoxRef.current) {
      ro = new ResizeObserver(updateRightPad);
      ro.observe(calendarBoxRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateRightPad);
      if (ro && calendarBoxRef.current) ro.disconnect();
    };
  }, []);

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
        if (headerErr) {
          console.error("Error cargando cabecera:", headerErr);
          toast.error("Error cargando cabecera");
        }
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
        if (headerErr) {
          console.error("Error cargando cabecera por allocation_period:", headerErr);
          toast.error("No se encontró cabecera para el período");
        }
        headerData = h || null;
        headerIdResolved = headerData?.id || null;
      }

      setHeader(headerData);
      setResolvedHeaderId(headerIdResolved);
      setDebugInfo({ ap, headerIdProp: headerId ?? null, headerIdResolved });

      // 2) Las líneas ahora se cargan vía React Query (ver linesQuery)
      if (!headerIdResolved) {
        // Si no encontramos cabecera, limpiamos líneas
        setLines([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [headerId, location.search]);

  // React Query: cargar líneas por header_id, con cache y estados
  const effectiveKey = effectiveHeaderId;
  const queryClient = useQueryClient();
  const linesQuery = useQuery({
    queryKey: ["lines", effectiveKey],
    enabled: !!effectiveKey,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("timesheet")
        .select("*")
        .eq("header_id", effectiveKey);
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      return sorted.map((line) => ({ ...line, date: toDisplayDate(line.date) }));
    },
    onError: () => toast.error("Error cargando líneas"),
  });

  // Cuando llegan las líneas, actualizar estado local y edición inicial con dos decimales
  useEffect(() => {
    if (!linesQuery.data) return;
    const linesFormatted = linesQuery.data;
    setLines(linesFormatted);
    const initialEditData = {};
    linesFormatted.forEach((line) => {
      initialEditData[line.id] = { ...line, quantity: toTwoDecimalsString(line.quantity) };
    });
    setEditFormData(initialEditData);
  }, [linesQuery.data]);

  // --- Autosave per-line (debounced) ---
  const updateLineMutation = useMutation({
    mutationFn: async (id) => {
      const row = prepareRowForDb(editFormData[id] || {}, {});
      const { error } = await supabaseClient.from("timesheet").update(row).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      toast.success("Guardado", { id: `autosave-${id}`, duration: 1200 });
      setLastSavedAt(new Date());
      queryClient.invalidateQueries({ queryKey: ["lines", effectiveHeaderId] }).catch(() => {});
    },
    onError: (err, id) => {
      console.error("Autosave error line", id, err);
      toast.error("Error auto‑guardando línea");
    },
  });

  const scheduleAutosave = (id) => {
    try {
      if (!id) return;
      if (String(id).startsWith("tmp-")) return; // no actualizar filas aún no insertadas
      // Evitar guardar si hay errores visibles en ESTA línea
      const hasLineErrors = !!errors[id] && Object.values(errors[id]).some(Boolean);
      if (hasLineErrors) return;
      const prev = autosaveTimersRef.current[id];
      if (prev) clearTimeout(prev);
      autosaveTimersRef.current[id] = setTimeout(() => {
        updateLineMutation.mutate(id);
      }, 900);
    } catch {}
  };

  const saveLineNow = (id) => {
    try {
      if (!id) return;
      if (String(id).startsWith("tmp-")) return;
      const hasLineErrors = !!errors[id] && Object.values(errors[id]).some(Boolean);
      if (hasLineErrors) return;
      const prev = autosaveTimersRef.current[id];
      if (prev) clearTimeout(prev);
      updateLineMutation.mutate(id);
    } catch {}
  };

  // Re-render periódico para actualizar el mensaje "Guardado hace X"
  useEffect(() => {
    const t = setInterval(() => {
      if (lastSavedAt) setLastSavedAt((d) => (d ? new Date(d) : d));
    }, 5000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  // (El atajo global Ctrl/Cmd + Enter se elimina, ya que ahora el autosave es por campo)

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
          nextErrors[id] = { ...(nextErrors[id] || {}), date: "Día festivo: no se permiten horas" };
        } else {
          nextErrors[id] = { ...(nextErrors[id] || {}), date: "Día festivo: no se permiten horas" };
        }
        continue; // no más validaciones sobre festivos
      }

      // Nota: permitimos imputar aunque required <= 0 (sin error ni autocorrección)

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
            quantity: toTwoDecimalsString(l.quantity),
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
      quantity: "0.00",
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
        [id]: { ...(prev[id] || {}), date: "Día festivo: no se permiten horas" },
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
      delete e.date;
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
        [id]: { ...(prev[id] || {}), date: "Día festivo: no se permiten horas" },
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
      toast.error("Corrige los errores diarios antes de guardar");
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
      toast.error("Hubo errores al guardar");
      return;
    }

    toast.success("Guardado correctamente");
    setLastSavedAt(new Date());

    // Invalidate para que React Query recargue líneas
    try {
      await queryClient.invalidateQueries({ queryKey: ["lines", effectiveHeaderId] });
    } catch {}
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
      <div style={{ position: "relative", marginBottom: 12, minHeight: calendarHeight }}>
        {/* Header ocupa todo el ancho, con padding a la derecha para no quedar debajo del calendario */}
        <div style={{ paddingRight: rightPad }}>
          <TimesheetHeader header={header} />
        </div>

        {/* Tarjeta de totales (estilo BC) + Calendario a la derecha */}
        <div style={{ position: "absolute", top: 0, right: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Tarjeta compacta con totales, reutiliza clases BC */}
          <div className="bc-card bc-card--compact">
            <div className="bc-card__title bc-card__title--small">Resumen mes</div>
            <div className="summary-grid">
              <span>Requeridas</span><strong>{Object.values(dailyRequired||{}).reduce((a,b)=>a+(Number(b)||0),0).toFixed(2)}</strong>
              <span>Imputadas</span><strong>{Object.values(editFormData||{}).reduce((a,r)=>a+(Number(r?.quantity)||0),0).toFixed(2)}</strong>
              <span>Faltan</span><strong>{(Math.max(0, Object.values(dailyRequired||{}).reduce((a,b)=>a+(Number(b)||0),0) - Object.values(editFormData||{}).reduce((a,r)=>a+(Number(r?.quantity)||0),0))).toFixed(2)}</strong>
            </div>
          </div>

          {/* Calendario compacto */}
          <div ref={calendarBoxRef} style={{ width: 210, border: "1px solid #d9d9d9", borderRadius: 6, padding: 12, background: "#fff" }}>
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
            {/* Leyenda (2 columnas) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                justifyContent: "space-between",
                alignItems: "center",
                rowGap: 6,
                columnGap: 8,
                marginTop: 8,
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, backgroundColor: "red", borderRadius: 3 }}></span>
                <span>Sin horas</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, backgroundColor: "yellow", borderRadius: 3 }}></span>
                <span>Parcial</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, backgroundColor: "lightgreen", borderRadius: 3 }}></span>
                <span>Completo</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, backgroundColor: "lightgray", borderRadius: 3 }}></span>
                <span>Festivo</span>
              </div>
            </div>

            {/* Totales del mes: ahora en tarjeta; removidos aquí para no duplicar */}
          </div>
        </div>
      </div>
      {/* Sección de líneas debajo, ocupa todo el ancho, alineada con margen derecho del calendario */}
      <div style={{ marginTop: 24, paddingRight: rightPad }}>
        <h3>Líneas</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span style={{ color: "#666", fontSize: 12 }}>{formatTimeAgo(lastSavedAt)}</span>
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
          scheduleAutosave={scheduleAutosave}
          saveLineNow={saveLineNow}
        />
      </div>
    </div>
  );
}

export default TimesheetEdit;
