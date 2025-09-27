// src/components/TimesheetLines.jsx
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import TIMESHEET_FIELDS, {
    COL_MAX_WIDTH,
    COL_MIN_WIDTH,
    DEFAULT_COL_WIDTH,
    TIMESHEET_ALIGN,
    TIMESHEET_LABELS,
} from "../constants/timesheetFields";
import useColumnResize from "../hooks/useColumnResize";
import { useJobs, useWorkTypes } from "../hooks/useTimesheetQueries";
import "../styles/TimesheetLines.css";
import { supabaseClient } from "../supabaseClient";
import { toIsoFromInput } from "../utils/dateHelpers";
import DateCell from "./timesheet/DateCell";
import DepartmentCell from "./timesheet/DepartmentCell";
import ProjectCell from "./timesheet/ProjectCell";
import ProjectDescriptionCell from "./timesheet/ProjectDescriptionCell";
import TaskCell from "./timesheet/TaskCell";
import WorkTypeCell from "./timesheet/WorkTypeCell";
import BcModal from "./ui/BcModal";
import DecimalInput from "./ui/DecimalInput";
import EditableCell from "./ui/EditableCell";

export default function TimesheetLines({
  lines,
  editFormData,
  errors,
  inputRefs,
  hasRefs,
  setSafeRef,
  header,
  editableHeader,
  periodChangeTrigger, // 🆕 Recibir trigger para forzar re-renderizado
  serverDate, // 🆕 Fecha del servidor para fallback de hoy y default
  calendarHolidays,
  scheduleAutosave,
  saveLineNow,
  savingByLine: _savingByLine,
  onLinesChange,
  setLines,
  effectiveHeaderId,
  sortLines, // 🆕 Función para ordenar líneas
  onLineDelete: _onLineDelete,
  onLineAdd: _onLineAdd,
  markAsChanged: _markAsChanged,
  addEmptyLine: _addEmptyLine, // 🆕 Función para agregar línea vacía
  handleKeyDown,
  handleInputChange: parentHandleInputChange, // ✅ Recibir función del padre
  onLineSelectionChange, // 🆕 Nueva función para manejar selección
  selectedLines = [], // 🆕 Array de IDs de líneas seleccionadas
  onDuplicateLines: _onDuplicateLines, // 🆕 Función para duplicar líneas seleccionadas
  onDeleteLines: _onDeleteLines, // 🆕 Función para borrar líneas seleccionadas
  showResponsible = false, // 🆕 Mostrar columna de responsable (solo aprobación)
  showResourceColumns = false, // 🆕 Mostrar columnas de recurso (solo aprobación)
  extraColumns = [], // 🆕 Columnas extra (se insertan tras la columna de selección)
  readOnly = false,
}) {
  const extraKeys = Array.isArray(extraColumns)
    ? extraColumns.map((c) => String(c.key))
    : [];
  const allKeys = [...extraKeys, ...TIMESHEET_FIELDS];

  // Normativa listas: clamp por contenedor, límites por columna y desactivar resize para fecha
  const disabledResizeCols = new Set(["date"]);
  const { colStyles, onMouseDown, setWidths } = useColumnResize(
    allKeys,
    "timesheet_column_widths",
    DEFAULT_COL_WIDTH,
    {
      perColumnMin: COL_MIN_WIDTH,
      perColumnMax: COL_MAX_WIDTH,
      getContainerWidth: () => tableRef.current?.parentElement?.clientWidth,
      disableResizeFor: Array.from(disabledResizeCols),
    }
  );

  // Filtrar líneas "vacías" que puedan venir desde el servidor (todas las celdas vacías y cantidad 0)
  const safeLines = Array.isArray(lines)
    ? lines.filter((l) => {
        const isTmp = String(l.id || "").startsWith("tmp-");
        const hasData = Boolean(
          l.job_no || l.job_task_no || l.description || l.work_type || l.date
        );
        const qty = Number(l.quantity) || 0;
        // Mostrar siempre las temporales; ocultar las totalmente vacías del backend
        return isTmp || hasData || qty !== 0;
      })
    : [];
  const tableRef = useRef(null);
  const headTableRef = useRef(null);

  const getAlign = (key) => TIMESHEET_ALIGN?.[key] || "left";

  // Función para identificar si una columna es editable
  // isColumnEditable eliminado (no usado)

  // ===============================
  // Jobs & Job Tasks (combos)
  // ===============================
  // Eliminado estado local de jobs: usamos React Query
  const [jobFilter, setJobFilter] = useState({}); // { [lineId]: "filtro" }
  const [jobOpenFor, setJobOpenFor] = useState(null); // lineId con dropdown abierto

  const [tasksByJob, setTasksByJob] = useState({}); // { [job_no]: [{job_no, no, description}] }
  const [taskFilter, setTaskFilter] = useState({}); // { [lineId]: "filtro" }
  const [taskOpenFor, setTaskOpenFor] = useState(null); // lineId con dropdown abierto para tareas

  // Servicios (work_type) por recurso actual
  // Eliminado estado local de workTypes: usamos React Query
  const [wtFilter, setWtFilter] = useState({}); // { [lineId]: "filtro" }
  const [wtOpenFor, setWtOpenFor] = useState(null); // lineId con dropdown abierto
  // movido a WorkTypeCell

  // React Query: Carga y cache de proyectos por recurso (hook reutilizable)
  const jobsQuery = useJobs((header || editableHeader)?.resource_no);
  const jobs = jobsQuery.data || [];
  const jobsLoaded = !jobsQuery.isLoading;

  // React Query: Carga y cache de servicios por recurso
  const workTypesQuery = useWorkTypes((header || editableHeader)?.resource_no);
  const workTypes = Array.isArray(workTypesQuery.data)
    ? workTypesQuery.data
    : [];
  const workTypesLoaded = workTypesQuery.isSuccess;

  // Logs de debugging removidos - funcionalidad ya estable

  // Tareas por job: usar React Query como caché programática
  const queryClient = useQueryClient();
  const ensureTasksLoaded = async (jobNo) => {
    if (!jobNo) return [];
    const data = await queryClient.fetchQuery({
      queryKey: ["tasks", jobNo],
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const { data, error } = await supabaseClient
          .from("job_task")
          .select("job_no, no, description")
          .eq("job_no", jobNo)
          .order("no")
          .limit(1000);
        if (error) throw error;
        return data || [];
      },
    });
    setTasksByJob((prev) => ({ ...prev, [jobNo]: data }));
    return data;
  };

  // Filtrados visibles
  const getVisibleJobs = (lineId) => {
    const q = (jobFilter[lineId] || "").toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.no?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
    );
  };

  const getVisibleTasks = (lineId, jobNo) => {
    const list = tasksByJob[jobNo] || [];
    const q = (taskFilter[lineId] || "").toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.no?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  };

  // visibilidad de tipos se maneja en WorkTypeCell

  const findWorkType = (val) => {
    if (!val) return null;
    const v = String(val).trim().toLowerCase();

    // 🆕 Buscar coincidencia exacta primero
    let found = (workTypes || []).find((wt) => wt?.toLowerCase() === v);
    if (found) return found;

    // 🆕 Si no hay coincidencia exacta, buscar tipos de trabajo que contengan el texto
    const containsMatches = (workTypes || []).filter((wt) =>
      wt?.toLowerCase().includes(v)
    );

    // Si hay exactamente una coincidencia que contenga el texto, usarla
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    // Si hay múltiples coincidencias, no autocompletar (dejar que el usuario elija)
    return null;
  };

  // Modal para reabrir UNA línea Rechazada (mostrar motivo)
  const [reopenModal, setReopenModal] = useState({ open: false, lineId: null, dateIso: null, reason: "" });
  const openReopenModalForLine = (line) => {
    const dateIso = line?.date ? toIsoFromInput(line.date) : null;
    setReopenModal({
      open: true,
      lineId: line?.id || null,
      dateIso,
      reason: line?.rejection_cause || "",
    });
  };
  const confirmReopen = async () => {
    try {
      const id = reopenModal.lineId;
      if (!id) return;
      const { error } = await supabaseClient
        .from("timesheet")
        .update({ status: "Open" })
        .eq("id", id);
      if (error) throw error;
      if (setLines) {
        setLines((prevLines) =>
          sortLines
            ? sortLines(prevLines.map((l) => (l.id === id ? { ...l, status: "Open" } : l)))
            : prevLines.map((l) => (l.id === id ? { ...l, status: "Open" } : l))
        );
      }
      if (effectiveHeaderId) {
        await Promise.resolve(
          queryClient.invalidateQueries({ queryKey: ["lines", effectiveHeaderId] })
        );
      }
          } catch {
      // noop
    } finally {
      setReopenModal({ open: false, lineId: null, dateIso: null, reason: "" });
    }
  };

  // Helpers de validación/normalización para Proyecto y Tarea
  const findJob = (val) => {
    if (!val) return null;
    const v = String(val).trim().toLowerCase();

    // 🆕 Buscar coincidencia exacta primero
    let found = jobs.find((j) => j.no?.toLowerCase() === v);
    if (found) return found;

    // 🆕 Si no hay coincidencia exacta, buscar proyectos que contengan el texto
    const containsMatches = jobs.filter(
      (j) =>
        j.no?.toLowerCase().includes(v) ||
        j.description?.toLowerCase().includes(v)
    );

    // Si hay exactamente una coincidencia que contenga el texto, usarla
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    // Si hay múltiples coincidencias, no autocompletar (dejar que el usuario elija)
    return null;
  };

  const findTask = (jobNo, val) => {
    if (!jobNo || !val) return null;
    const list = tasksByJob[jobNo] || [];
    const v = String(val).trim().toLowerCase();

    // 🆕 Buscar coincidencia exacta primero
    let found = list.find((t) => t.no?.toLowerCase() === v);
    if (found) return found;

    // 🆕 Si no hay coincidencia exacta, buscar tareas que contengan el texto
    const containsMatches = list.filter(
      (t) =>
        t.no?.toLowerCase().includes(v) ||
        t.description?.toLowerCase().includes(v)
    );

    // Si hay exactamente una coincidencia que contenga el texto, usarla
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    // Si hay múltiples coincidencias, no autocompletar (dejar que el usuario elija)
    return null;
  };

  // Errores locales para validación de Proyecto/Tarea
  const [localErrors, setLocalErrors] = useState({}); // { [lineId]: { job_no?: string, job_task_no?: string } }
  const setFieldError = (lineId, field, message) => {
    setLocalErrors((prev) => ({
      ...prev,
      [lineId]: { ...(prev[lineId] || {}), [field]: message },
    }));
  };
  const clearFieldError = (lineId, field) => {
    setLocalErrors((prev) => ({
      ...prev,
      [lineId]: { ...(prev[lineId] || {}), [field]: undefined },
    }));
  };

  // ===============================
  // Auto-fit por doble clic (límites por columna)
  // ===============================
  const measureWithSpan = (baseEl, text) => {
    const span = document.createElement("span");
    const cs = baseEl ? window.getComputedStyle(baseEl) : null;

    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre";
    if (cs) {
      span.style.fontFamily = cs.fontFamily;
      span.style.fontSize = cs.fontSize;
      span.style.fontWeight = cs.fontWeight;
      span.style.letterSpacing = cs.letterSpacing;
    }
    span.textContent = text || "";

    document.body.appendChild(span);
    const width = Math.ceil(span.getBoundingClientRect().width);
    document.body.removeChild(span);
    return width;
  };

  const handleAutoFit = (colKey) => {
    const table = tableRef.current;
    if (!table) return;

    const colIndex = allKeys.indexOf(colKey);
    if (colIndex === -1) return;

    let maxContent = 0;

    const th = table.querySelector(`thead tr th:nth-child(${colIndex + 1})`);
    const thText = th ? th.childNodes[0]?.textContent?.trim() || "" : "";
    maxContent = Math.max(maxContent, measureWithSpan(th, thText));

    const tds = table.querySelectorAll(
      `tbody tr td:nth-child(${colIndex + 1})`
    );
    tds.forEach((td) => {
      const input = td.querySelector("input");
      const txt = input ? (input.value ?? "") : td.textContent?.trim() || "";
      maxContent = Math.max(maxContent, measureWithSpan(input || td, txt));
    });

    const EXTRA = 6;
    const min = COL_MIN_WIDTH?.[colKey] ?? 100;
    const max = COL_MAX_WIDTH?.[colKey] ?? 300;

    const finalWidth = Math.max(min, Math.min(max, maxContent + EXTRA));
    setWidths((prev) => ({ ...prev, [colKey]: finalWidth }));
  };

  // ===============================
  // Render
  // ===============================
  const handleInputChange = useCallback(
    (lineId, event) => {
      const { name, value } = event.target;

      // ✅ Si se cambia el proyecto, usar la función del padre para obtener departamento automático
      if (name === "job_no" && parentHandleInputChange) {
        parentHandleInputChange(lineId, event);
        return;
      }

      // Para otros campos, comportamiento normal
      onLinesChange(lineId, { [name]: value });
    },
    [onLinesChange, parentHandleInputChange]
  );

  const handleInputFocus = (lineId, field, event) => {
    if (inputRefs && inputRefs.current) {
      inputRefs.current[lineId] = {
        ...inputRefs.current[lineId],
        [field]: event.target,
      };
    }
  };

  // handleKeyDown viene de useTimesheetEdit.jsx y maneja todas las teclas de navegación
  // incluyendo ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Tab y Enter

  // handlers de fecha locales eliminados (no usados)

  // estado local de calendario eliminado (no usado)

  // 🆕 Estado para selección de líneas
  const [localSelectedLines, setLocalSelectedLines] = useState(
    selectedLines || []
  );

  // 🆕 Sincronizar selección local con props
  useEffect(() => {
    setLocalSelectedLines(selectedLines || []);
  }, [selectedLines]);

  // 🆕 Función para manejar selección individual
  const handleLineSelection = (lineId, isSelected) => {
    const newSelection = isSelected
      ? [...localSelectedLines, lineId]
      : localSelectedLines.filter((id) => id !== lineId);

    setLocalSelectedLines(newSelection);
    if (onLineSelectionChange) {
      onLineSelectionChange(newSelection);
    }
  };

  // 🆕 Función para seleccionar/deseleccionar todas las líneas
  const handleSelectAll = (selectAll) => {
    const newSelection = selectAll ? safeLines.map((line) => line.id) : [];
    setLocalSelectedLines(newSelection);
    if (onLineSelectionChange) {
      onLineSelectionChange(newSelection);
    }
  };

  // 🆕 Función helper para verificar si una línea es editable
  const isLineEditable = (line) => {
    if (readOnly) return false;
    // Las líneas de Factorial no son editables
    if (line.isFactorialLine) return false;
    // Las líneas con estado "Pending" no son editables
    if (line.status === "Pending") return false;
    // Las líneas con estado "Rejected" no son editables hasta reabrir
    if (line.status === "Rejected") return false;
    return true;
  };

  // Eliminar línea ficticia: no agregar filas vacías automáticamente

  // ===============================
  // Doble tabla: header fijo + body scroll
  // ===============================
  const filteredTimesheetFields = TIMESHEET_FIELDS.filter(
    (key) => showResourceColumns || (key !== "resource_no" && key !== "resource_name")
  );
  const colKeys = [
    "__select__",
    ...extraKeys,
    ...filteredTimesheetFields,
    ...(showResponsible ? ["__responsible__"] : []),
  ];
  const getColWidth = (key) => {
    if (key === "__select__") return "40px";
    if (key === "__responsible__") return "160px";
    const style = colStyles[key] || {};
    const w = style && style.width;
    if (typeof w === "number") return `${w}px`;
    if (typeof w === "string") return w;
    return undefined;
  };

  // Posicionamiento de Tipo trabajo movido a WorkTypeCell

  return (
    <div className="ts-lines-wrap">
      {/* Tabla: solo encabezado (fijo) */}
      <div className="ts-lines-header">
        <table ref={headTableRef} className="ts-table">
          <colgroup>
            {colKeys.map((k) => (
              <col key={`head-col-${k}`} style={{ width: getColWidth(k) }} />
            ))}
          </colgroup>
        <thead>
          <tr>
            {/* 🆕 Columna de selección (iconos) */}
            <th
              className="ts-th"
              style={{
                width: "40px",
                textAlign: "center",
                padding: "8px 4px",
              }}
            >
              <input
                type="checkbox"
                checked={
                  localSelectedLines.length === safeLines.length &&
                  safeLines.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
            </th>

            {/* 🆕 Encabezados de columnas extra (tras selección) */}
            {Array.isArray(extraColumns) &&
              extraColumns.map((col) => (
                <th
                  key={`extra-head-${col.key}`}
                  className="ts-th"
                  style={{ ...(colStyles[col.key] || {}), textAlign: "center" }}
                >
                  {col.label || col.key}
                  <span
                    className="ts-resizer"
                    onMouseDown={(e) => onMouseDown(e, col.key)}
                    onDoubleClick={() => handleAutoFit(col.key)}
                    aria-hidden
                  />
                </th>
              ))}

            {TIMESHEET_FIELDS.map((key) => (
              (showResourceColumns || (key !== "resource_no" && key !== "resource_name")) && (
                <th
                  key={key}
                  data-col={key}
                  className="ts-th"
                  style={{ ...colStyles[key], textAlign: "center" }}
                >
                  {TIMESHEET_LABELS?.[key] || key}
                  <span
                    className="ts-resizer"
                    onMouseDown={(e) => onMouseDown(e, key)}
                    onDoubleClick={() => handleAutoFit(key)}
                    aria-hidden
                  />
                </th>
              )
            ))}
            {showResponsible && (
              <th className="ts-th" style={{ width: "160px", textAlign: "center" }}>
                Responsable
              </th>
            )}
          </tr>
        </thead>
        </table>
      </div>

      {/* Tabla: solo cuerpo (scroll) */}
      <div className="ts-responsive" style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <table ref={tableRef} className="ts-table">
          <colgroup>
            {colKeys.map((k) => (
              <col key={`body-col-${k}`} style={{ width: getColWidth(k) }} />
            ))}
          </colgroup>
        <tbody>
          {/* Líneas existentes */}
          {safeLines.map((line, lineIndex) => (
            <tr key={line.id}>
              {/* 🆕 Columna de selección (iconos) */}
              <td
                className="ts-td"
                style={{
                  width: "40px",
                  textAlign: "center",
                  padding: "8px 4px",
                  verticalAlign: "middle",
                }}
              >
                {line.status === "Pending" && !showResponsible ? (
                  <input
                    type="checkbox"
                    checked={localSelectedLines.includes(line.id)}
                    onChange={(e) =>
                      handleLineSelection(line.id, e.target.checked)
                    }
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                ) : line.status === "Pending" && showResponsible ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      transition: "background-color 0.2s ease",
                    }}
                    onClick={async () => {
                      try {
                        // 🆕 Obtener la fecha de la línea en formato ISO para buscar todas las líneas del mismo día
                        const lineDateIso = line.date
                          ? toIsoFromInput(line.date)
                          : null;

                        if (!lineDateIso) {
                          console.error(
                            "No se pudo obtener la fecha de la línea"
                          );
                          return;
                        }

                        // 🆕 Buscar TODAS las líneas del mismo día que estén en estado Pending
                        const linesToRevert = lines.filter((l) => {
                          const lDateIso = l.date
                            ? toIsoFromInput(l.date)
                            : null;
                          return (
                            lDateIso === lineDateIso && l.status === "Pending"
                          );
                        });

                        if (linesToRevert.length === 0) {
                          console.log(
                            "No hay líneas Pending para revertir en este día"
                          );
                          return;
                        }

                        console.log(
                          `🔄 Revirtiendo ${linesToRevert.length} líneas del día ${lineDateIso}`
                        );

                        // 🆕 Actualizar TODAS las líneas del mismo día en la base de datos
                        const updatePromises = linesToRevert.map((l) =>
                          supabaseClient
                            .from("timesheet")
                            .update({ status: "Open" })
                            .eq("id", l.id)
                        );

                        const results = await Promise.all(updatePromises);

                        // Verificar si hubo errores
                        const errors = results.filter((result) => result.error);
                        if (errors.length > 0) {
                          console.error("Errores actualizando líneas:", errors);
                          return;
                        }

                        // 🆕 Actualizar estado local de TODAS las líneas del mismo día
                        if (setLines) {
                          setLines((prevLines) =>
                            sortLines
                              ? sortLines(
                                  prevLines.map((l) => {
                                    const lDateIso = l.date
                                      ? toIsoFromInput(l.date)
                                      : null;
                                    if (
                                      lDateIso === lineDateIso &&
                                      l.status === "Pending"
                                    ) {
                                      return { ...l, status: "Open" };
                                    }
                                    return l;
                                  })
                                )
                              : prevLines.map((l) => {
                                  const lDateIso = l.date
                                    ? toIsoFromInput(l.date)
                                    : null;
                                  if (
                                    lDateIso === lineDateIso &&
                                    l.status === "Pending"
                                  ) {
                                    return { ...l, status: "Open" };
                                  }
                                  return l;
                                })
                          );
                        }

                        // Invalidar queries para refrescar datos desde la base de datos
                        console.log(
                          "🔄 Invalidando queries para headerId:",
                          effectiveHeaderId
                        );
                        if (effectiveHeaderId) {
                          queryClient.invalidateQueries({
                            queryKey: ["lines", effectiveHeaderId],
                          });
                          console.log("✅ Queries invalidadas correctamente");
                        } else {
                          console.log(
                            "❌ No hay effectiveHeaderId para invalidar queries"
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error al revertir líneas del día:",
                          error
                        );
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#D9F0F2";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                    title="Hacer clic para revertir a estado Open"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: "#007E87" }}
                    >
                      <path
                        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M9 9H15" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M9 13H15"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M9 17H13"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 17L17 19L21 15"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                ) : line.status === "Approved" ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                    title="Línea aprobada"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: "#10B981" }}
                    >
                      <path
                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : line.status === "Rejected" ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    title={line.rejection_cause ? `Motivo: ${line.rejection_cause}` : "Reabrir línea (a estado Open)"}
                    onClick={() => openReopenModalForLine(line)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#FEE2E2";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ color: "#EF4444" }}
                    >
                      <path
                        d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 9L9 15M9 9L15 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                ) : (
                  <input
                    type="checkbox"
                    checked={localSelectedLines.includes(line.id)}
                    onChange={(e) =>
                      handleLineSelection(line.id, e.target.checked)
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                )}
              </td>

              {/* 🆕 Celdas de columnas extra (tras selección) */}
              {Array.isArray(extraColumns) &&
                extraColumns.map((col) => (
                  <td
                    key={`extra-${col.key}-${line.id}`}
                    className="ts-td"
                    style={{
                      ...(colStyles[col.key] || {}),
                      textAlign: col.align || "left",
                      padding: "8px",
                      verticalAlign: "middle",
                    }}
                  >
                    {typeof col.renderCell === "function"
                      ? col.renderCell(line)
                      : (line?.[col.key] ?? "")}
                  </td>
                ))}

              {/* ----- CÓDIGO RECURSO: solo lectura ----- */}
              {showResourceColumns && (
                <td
                  className="ts-td"
                  style={{
                    ...colStyles.resource_no,
                    textAlign: getAlign("resource_no"),
                    padding: "8px",
                    verticalAlign: "middle",
                  }}
                >
                  <div className="ts-readonly">{line.resource_no || ""}</div>
                </td>
              )}

              {/* ----- NOMBRE RECURSO: solo lectura ----- */}
              {showResourceColumns && (
                <td
                  className="ts-td"
                  style={{
                    ...colStyles.resource_name,
                    textAlign: getAlign("resource_name"),
                    padding: "8px",
                    verticalAlign: "middle",
                  }}
                >
                  <div className="ts-readonly">{line.resource_name || ""}</div>
                </td>
              )}

              {/* ----- PROYECTO: combo buscable ----- */}
              <ProjectCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.job_no}
                align={getAlign("job_no")}
                editFormData={editFormData}
                inputRefs={inputRefs}
                hasRefs={hasRefs}
                setSafeRef={setSafeRef}
                error={localErrors[line.id]?.job_no}
                isEditable={isLineEditable(line)} // 🆕 Pasar si es editable
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                }}
                jobsState={{
                  jobsLoaded,
                  jobs,
                  jobFilter,
                  setJobFilter,
                  jobOpenFor,
                  setJobOpenFor,
                  getVisibleJobs,
                  ensureTasksLoaded,
                  findJob,
                }}
              />

              {/* ----- DESCRIPCIÓN DEL PROYECTO: NO editable ----- */}
              <ProjectDescriptionCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.job_no_description}
                align={getAlign("job_no_description")}
                jobs={jobs}
                findJob={findJob}
                editFormData={editFormData[line.id]} // Pasar editFormData para detectar cambios
              />

              {/* ----- TAREA: combo dependiente ----- */}
              <TaskCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.job_task_no}
                align={getAlign("job_task_no")}
                editFormData={editFormData}
                inputRefs={inputRefs}
                hasRefs={hasRefs}
                setSafeRef={setSafeRef}
                error={localErrors[line.id]?.job_task_no}
                isEditable={isLineEditable(line)} // 🆕 Pasar si es editable
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                }}
                tasksState={{
                  tasksByJob,
                  taskFilter,
                  setTaskFilter,
                  taskOpenFor,
                  setTaskOpenFor,
                  getVisibleTasks,
                  ensureTasksLoaded,
                  findTask,
                }}
              />

              {/* ----- Descripción ----- */}
              <EditableCell
                style={{
                  ...colStyles.description,
                  textAlign: getAlign("description"),
                }}
              >
                {isLineEditable(line) ? (
                  <input
                    type="text"
                    name="description"
                    value={editFormData[line.id]?.description || ""}
                    onChange={(e) => handleInputChange(line.id, e)}
                    onBlur={() => {
                      if (typeof saveLineNow === "function")
                        saveLineNow(line.id);
                      else if (typeof scheduleAutosave === "function")
                        scheduleAutosave(line.id);
                    }}
                    onFocus={(e) => handleInputFocus(line.id, "description", e)}
                    onKeyDown={(e) =>
                      handleKeyDown(
                        e,
                        lineIndex,
                        TIMESHEET_FIELDS.indexOf("description")
                      )
                    }
                    ref={
                      hasRefs
                        ? (el) => setSafeRef(line.id, "description", el)
                        : null
                    }
                    className="ts-input"
                    style={{
                      textAlign: "inherit !important", // 🆕 Heredar alineación del padre con !important
                    }}
                  />
                ) : (
                  <div className="ts-readonly">{line.description || ""}</div>
                )}
              </EditableCell>

              {/* ----- Servicio (work_type): combo por recurso ----- */}
              <WorkTypeCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.work_type}
                align={getAlign("work_type")}
                editFormData={editFormData}
                inputRefs={inputRefs}
                hasRefs={hasRefs}
                setSafeRef={setSafeRef}
                error={localErrors[line.id]?.work_type}
                isEditable={isLineEditable(line)}
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                }}
                wtState={{
                  workTypesLoaded,
                  workTypes,
                  wtFilter,
                  setWtFilter,
                  wtOpenFor,
                  setWtOpenFor,
                  findWorkType,
                }}
                saving={{ saveLineNow, scheduleAutosave }}
              />

              {/* ----- Fecha (derecha) ----- */}
              <DateCell
                key={`${line.id}-${editableHeader?.allocation_period || header?.allocation_period || "default"}-${periodChangeTrigger}`} // 🆕 Key que cambia cuando cambia el período O el trigger
                line={line}
                lineIndex={lineIndex}
                editFormData={editFormData}
                handleInputChange={handleInputChange}
                hasRefs={hasRefs}
                setSafeRef={setSafeRef}
                error={errors[line.id]?.date}
                header={header}
                editableHeader={editableHeader} // 🆕 Pasar editableHeader para validación en inserción
                serverDate={serverDate}
                calendarHolidays={calendarHolidays}
                disabled={!isLineEditable(line)} // 🆕 Deshabilitar para líneas de Factorial
                align={getAlign("date")} // 🆕 Pasar alineación correcta
                handleInputFocus={handleInputFocus}
                handleKeyDown={handleKeyDown}
              />

              {/* ----- Cantidad (derecha) ----- */}
              <EditableCell
                style={{ ...colStyles.quantity, verticalAlign: "top" }}
                align={getAlign("quantity")} // 🆕 Pasar alineación correcta
                error={
                  errors[line.id]?.quantity ||
                  (typeof errors[line.id] === "string" && errors[line.id])
                }
              >
                {isLineEditable(line) ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <DecimalInput
                      name="quantity"
                      value={(() => {
                        const q = editFormData[line.id]?.quantity;
                        if (typeof q === "number" || typeof q === "string")
                          return q;
                        if (q && typeof q === "object" && "value" in q)
                          return q.value;
                        return "";
                      })()}
                      onChange={({ target: { name, value } }) => {
                        handleInputChange(line.id, { target: { name, value } });
                      }}
                      onFocus={(e) => {
                        handleInputFocus(line.id, "quantity", e);
                      }}
                      onBlur={({ target: { name, value } }) => {
                        const hasError = !!(
                          errors[line.id]?.quantity ||
                          (typeof errors[line.id] === "string" &&
                            errors[line.id])
                        );
                        if (hasError) {
                          const el =
                            inputRefs?.current?.[line.id]?.["quantity"];
                          if (el)
                            setTimeout(() => {
                              try {
                                el.focus();
                                el.select();
                              } catch {
                                /* ignore */
                              }
                            }, 0);
                        }
                        handleInputChange(line.id, { target: { name, value } });
                        if (typeof saveLineNow === "function")
                          saveLineNow(line.id);
                        else if (typeof scheduleAutosave === "function")
                          scheduleAutosave(line.id);
                      }}
                      onKeyDown={(e) => {
                        const hasError = !!(
                          errors[line.id]?.quantity ||
                          (typeof errors[line.id] === "string" &&
                            errors[line.id])
                        );
                        if (
                          (e.key === "Enter" || e.key === "Tab") &&
                          hasError
                        ) {
                          e.preventDefault();
                          const el =
                            inputRefs?.current?.[line.id]?.["quantity"];
                          if (el)
                            setTimeout(() => {
                              try {
                                el.focus();
                                el.select();
                              } catch {
                                /* ignore */
                              }
                            }, 0);
                          return;
                        }
                        if (e.key === "Enter" || e.key === "Tab") {
                          if (typeof saveLineNow === "function")
                            saveLineNow(line.id);
                          else if (typeof scheduleAutosave === "function")
                            scheduleAutosave(line.id);
                        }
                        handleKeyDown(
                          e,
                          lineIndex,
                          TIMESHEET_FIELDS.indexOf("quantity")
                        );
                      }}
                      inputRef={
                        hasRefs
                          ? (el) => setSafeRef(line.id, "quantity", el)
                          : null
                      }
                      className={`ts-input ${
                        errors[line.id]?.quantity ||
                        (typeof errors[line.id] === "string" && errors[line.id])
                          ? "has-error"
                          : ""
                      }`}
                      min={0}
                      step={0.01}
                      decimals={2}
                    />
                  </div>
                ) : (
                  <div className="ts-readonly" style={{ textAlign: "inherit" }}>
                    {line.quantity ?? ""}
                  </div>
                )}
              </EditableCell>

              {/* ----- Departamento: NO editable ----- */}
              <DepartmentCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.department_code}
                align={getAlign("department_code")}
                editFormData={editFormData} // ✅ Pasar editFormData para mostrar valor actualizado
              />
              {showResponsible && (
                <td className="ts-td" style={{ width: "160px" }}>
                  <div className="ts-readonly">
                    {editFormData[line.id]?.job_responsible || line.job_responsible || ""}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <BcModal
        isOpen={reopenModal.open}
        onClose={() => setReopenModal({ open: false, lineId: null, dateIso: null, reason: "" })}
        title="Reabrir línea rechazada"
        confirmText="Reabrir"
        cancelText="Cancelar"
        confirmButtonType="primary"
        onConfirm={confirmReopen}
        onCancel={() => setReopenModal({ open: false, lineId: null, dateIso: null, reason: "" })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reopenModal.reason && (
            <div
              style={{
                padding: "8px 12px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 4,
                color: "#B91C1C",
              }}
            >
              <strong>Motivo del rechazo:</strong> {reopenModal.reason}
            </div>
          )}
          <p>
            ¿Deseas reabrir la línea del día {reopenModal.dateIso}?
          </p>
        </div>
      </BcModal>
    </div>
  );
}
