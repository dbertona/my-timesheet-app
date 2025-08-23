// src/components/TimesheetLines.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { parseDate, formatDate } from "../utils/dateHelpers";
import useColumnResize from "../hooks/useColumnResize";
import { supabaseClient } from "../supabaseClient";
import { useJobs, useWorkTypes, useTasks } from "../hooks/useTimesheetQueries";
import "../styles/TimesheetLines.css";
import TIMESHEET_FIELDS, { TIMESHEET_LABELS, TIMESHEET_ALIGN, COL_MIN_WIDTH, COL_MAX_WIDTH, DEFAULT_COL_WIDTH } from "../constants/timesheetFields";
import ProjectCell from "./timesheet/ProjectCell";
import ProjectDescriptionCell from "./timesheet/ProjectDescriptionCell";
import TaskCell from "./timesheet/TaskCell";
import DepartmentCell from "./timesheet/DepartmentCell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import InlineError from "./ui/InlineError";
import DecimalInput from "./ui/DecimalInput";
import DateInput from "./ui/DateInput";
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
  calendarHolidays,
  scheduleAutosave,
  saveLineNow,
  savingByLine,
  onLinesChange,
  onLineDelete,
  onLineAdd,
  markAsChanged,
  handleKeyDown,
  handleInputChange: parentHandleInputChange, // ✅ Recibir función del padre
  onLineSelectionChange, // 🆕 Nueva función para manejar selección
  selectedLines = [], // 🆕 Array de IDs de líneas seleccionadas
  onDuplicateLines, // 🆕 Función para duplicar líneas seleccionadas
  onDeleteLines, // 🆕 Función para borrar líneas seleccionadas
}) {
  const { colStyles, onMouseDown, setWidths } = useColumnResize(
    TIMESHEET_FIELDS,
    "timesheet_column_widths",
    DEFAULT_COL_WIDTH
  );

  const safeLines = Array.isArray(lines) ? lines : [];
  const tableRef = useRef(null);

  const getAlign = (key) => (TIMESHEET_ALIGN?.[key] || "left");

  // Función para identificar si una columna es editable
  const isColumnEditable = (colKey) => {
    // Columnas NO editables
    const nonEditableColumns = ["job_no_description", "department_code"];
    return !nonEditableColumns.includes(colKey);
  };


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

  // React Query: Carga y cache de proyectos por recurso (hook reutilizable)
  const jobsQuery = useJobs((header || editableHeader)?.resource_no);
  const jobs = jobsQuery.data || [];
  const jobsLoaded = !jobsQuery.isLoading;

  // React Query: Carga y cache de servicios por recurso
  const workTypesQuery = useWorkTypes((header || editableHeader)?.resource_no);
  const workTypes = Array.isArray(workTypesQuery.data) ? workTypesQuery.data : [];
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

  const getVisibleWorkTypes = (lineId) => {
    const q = (wtFilter[lineId] || "").toLowerCase();
    if (!q) return workTypes;
    return workTypes.filter((wt) => wt?.toLowerCase().includes(q));
  };

  const findWorkType = (val) => {
    if (!val) return null;
    const v = String(val).trim().toLowerCase();
    return (workTypes || []).find((wt) => wt?.toLowerCase() === v) || null;
  };
  const isValidWorkType = (val) => !!findWorkType(val);

  // Helpers de validación/normalización para Proyecto y Tarea
  const findJob = (val) => {
    if (!val) return null;
    const v = String(val).trim().toLowerCase();
    return jobs.find((j) => j.no?.toLowerCase() === v) || null;
  };
  const isValidJobNo = (val) => !!findJob(val);

  const findTask = (jobNo, val) => {
    if (!jobNo || !val) return null;
    const list = tasksByJob[jobNo] || [];
    const v = String(val).trim().toLowerCase();
    return list.find((t) => t.no?.toLowerCase() === v) || null;
  };
  const isValidTaskNo = (jobNo, val) => !!findTask(jobNo, val);

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

    const colIndex = TIMESHEET_FIELDS.indexOf(colKey);
    if (colIndex === -1) return;

    let maxContent = 0;

    const th = table.querySelector(`thead tr th:nth-child(${colIndex + 1})`);
    const thText = th ? (th.childNodes[0]?.textContent?.trim() || "") : "";
    maxContent = Math.max(maxContent, measureWithSpan(th, thText));

    const tds = table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`);
    tds.forEach((td) => {
      const input = td.querySelector("input");
      const txt = input ? (input.value ?? "") : (td.textContent?.trim() || "");
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
  const handleInputChange = useCallback((lineId, event) => {
    const { name, value } = event.target;

      // ✅ Si se cambia el proyecto, usar la función del padre para obtener departamento automático
  if (name === "job_no" && parentHandleInputChange) {
    parentHandleInputChange(lineId, event);
    return;
  }

    // Para otros campos, comportamiento normal
    onLinesChange(lineId, { [name]: value });
  }, [onLinesChange, parentHandleInputChange]);

  const handleInputFocus = (lineId, field, event) => {
    if (inputRefs && inputRefs.current) {
      inputRefs.current[lineId] = { ...inputRefs.current[lineId], [field]: event.target };
    }
  };

    // handleKeyDown viene de useTimesheetEdit.jsx y maneja todas las teclas de navegación
  // incluyendo ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Tab y Enter

  const handleDateInputChange = (lineId, val) => {
    onLinesChange(lineId, { date: val });
  };

  const handleDateInputBlur = (lineId, val) => {
    const date = parseDate(val);
    if (!date) {
      setFieldError(lineId, "date", "Fecha inválida.");
      const el = inputRefs?.current?.[lineId]?.["date"];
      if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
      return;
    }
    onLinesChange(lineId, { date: formatDate(date) });
  };

  const [calendarOpenFor, setCalendarOpenFor] = useState(null);

  // 🆕 Estado para selección de líneas
  const [localSelectedLines, setLocalSelectedLines] = useState(selectedLines || []);

  // 🆕 Sincronizar selección local con props
  useEffect(() => {
    setLocalSelectedLines(selectedLines || []);
  }, [selectedLines]);

  // 🆕 Función para manejar selección individual
  const handleLineSelection = (lineId, isSelected) => {
    const newSelection = isSelected
      ? [...localSelectedLines, lineId]
      : localSelectedLines.filter(id => id !== lineId);

    setLocalSelectedLines(newSelection);
    if (onLineSelectionChange) {
      onLineSelectionChange(newSelection);
    }
  };

  // 🆕 Función para seleccionar/deseleccionar todas las líneas
  const handleSelectAll = (selectAll) => {
    const newSelection = selectAll ? safeLines.map(line => line.id) : [];
    setLocalSelectedLines(newSelection);
    if (onLineSelectionChange) {
      onLineSelectionChange(newSelection);
    }
  };

  return (
    <div className="ts-responsive">


      <table ref={tableRef} className="ts-table">
        <thead>
          <tr>
            {/* 🆕 Columna de selección */}
            <th
              className="ts-th"
              style={{
                width: "40px",
                textAlign: "center",
                padding: "8px 4px"
              }}
            >
              <input
                type="checkbox"
                checked={localSelectedLines.length === safeLines.length && safeLines.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer"
                }}
              />
            </th>

            {TIMESHEET_FIELDS.map((key) => (
              <th
                key={key}
                data-col={key}
                className="ts-th"
                style={{ ...colStyles[key] }}
              >
                {TIMESHEET_LABELS?.[key] || key}
                <span
                  className="ts-resizer"
                  onMouseDown={(e) => onMouseDown(e, key)}
                  onDoubleClick={() => handleAutoFit(key)}
                  aria-hidden
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {safeLines.map((line, lineIndex) => (
            <tr key={line.id}>
              {/* 🆕 Columna de selección */}
              <td
                className="ts-td"
                style={{
                  width: "40px",
                  textAlign: "center",
                  padding: "8px 4px",
                  verticalAlign: "middle"
                }}
              >
                <input
                  type="checkbox"
                  checked={localSelectedLines.includes(line.id)}
                  onChange={(e) => handleLineSelection(line.id, e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer"
                  }}
                />
              </td>

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
                style={{ ...colStyles.description, textAlign: getAlign("description") }}
              >
                <input
                  type="text"
                  name="description"
                  value={editFormData[line.id]?.description || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onBlur={() => {
                    if (typeof saveLineNow === 'function') saveLineNow(line.id);
                    else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                  }}
                  onFocus={(e) => handleInputFocus(line.id, "description", e)}
                  onKeyDown={(e) => handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("description"))}
                  ref={hasRefs ? (el) => setSafeRef(line.id, "description", el) : null}
                  className="ts-input"
                />
              </EditableCell>

              {/* ----- Servicio (work_type): combo por recurso ----- */}
              <EditableCell
                style={{ ...colStyles.work_type, textAlign: getAlign("work_type") }}
                error={localErrors[line.id]?.work_type}
              >
                <div className="ts-cell">
                  <div className="ts-cell">
                    <input
                      type="text"
                      name="work_type"
                      value={editFormData[line.id]?.work_type || ""}
                      onChange={(e) => {
                        handleInputChange(line.id, e);
                        clearFieldError(line.id, "work_type");
                        setWtFilter((prev) => ({ ...prev, [line.id]: e.target.value }));
                      }}
                      onBlur={() => {
                        const raw = (editFormData[line.id]?.work_type || "").trim();
                        if (!raw) return; // permitir vacío sin error
                        const found = findWorkType(raw);
                        if (!found) {
                          setFieldError(line.id, "work_type", "Servicio inválido. Debe seleccionar uno de la lista.");
                          const el = inputRefs?.current?.[line.id]?.["work_type"];
                          if (el) setTimeout(() => { el.focus(); el.select(); }, 0);
                          return;
                        }
                        if (found !== raw) {
                          handleInputChange(line.id, { target: { name: "work_type", value: found } });
                        }
                        clearFieldError(line.id, "work_type");
                        if (typeof saveLineNow === 'function') saveLineNow(line.id);
                        else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                      }}
                      onFocus={(e) => {
                        handleInputFocus(line.id, "work_type", e);
                      }}
                      onKeyDown={(e) => {
                        const isAdvance = e.key === "Enter" || e.key === "Tab";
                        if (isAdvance) {
                          const raw = (editFormData[line.id]?.work_type || "").trim();
                          // Permitir vacío
                          if (!raw) {
                            clearFieldError(line.id, "work_type");
                            if (typeof saveLineNow === 'function') saveLineNow(line.id);
                            else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                            handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"));
                            return;
                          }
                          // Si coincide exacto con un servicio válido
                          const exact = findWorkType(raw);
                          if (exact) {
                            if (exact !== raw) {
                              handleInputChange(line.id, { target: { name: "work_type", value: exact } });
                            }
                            clearFieldError(line.id, "work_type");
                            if (typeof saveLineNow === 'function') saveLineNow(line.id);
                            else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                            e.preventDefault();
                            handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"));
                            return;
                          }
                          // Si hay una única coincidencia visible, seleccionarla
                          const list = getVisibleWorkTypes(line.id);
                          if (list.length === 1) {
                            const val = list[0];
                            handleInputChange(line.id, { target: { name: "work_type", value: val } });
                            clearFieldError(line.id, "work_type");
                            setWtFilter((prev) => ({ ...prev, [line.id]: val }));
                            setWtOpenFor(null);
                            if (typeof saveLineNow === 'function') saveLineNow(line.id);
                            else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                            e.preventDefault();
                            handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"));
                            return;
                          }
                          // Inválido → no avanzar, marcar error
                          e.preventDefault();
                          setFieldError(line.id, "work_type", "Servicio inválido. Debe seleccionar uno de la lista.");
                          const el = inputRefs?.current?.[line.id]?.["work_type"];
                          if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                          return;
                        }
                        // Alt + ArrowDown: abrir dropdown de servicios
                        if (e.altKey && e.key === "ArrowDown") {
                          setWtOpenFor((prev) => (prev === line.id ? null : line.id));
                          e.preventDefault();
                          return;
                        }
                        handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"));
                      }}
                      ref={hasRefs ? (el) => setSafeRef(line.id, "work_type", el) : null}
                      className={`ts-input ${localErrors[line.id]?.work_type ? 'has-error' : ''}`}
                      autoComplete="off"
                    />
                    <FiChevronDown
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setWtOpenFor((prev) => (prev === line.id ? null : line.id));
                      }}
                      className="ts-icon ts-icon--chevron"
                    />
                  </div>

                  {wtOpenFor === line.id && (
                    <div className="ts-dropdown" onMouseDown={(e) => e.preventDefault()}>
                      <div className="ts-dropdown__header">
                        <FiSearch />
                        <input
                          value={wtFilter[line.id] || ""}
                          onChange={(e) => setWtFilter((prev) => ({ ...prev, [line.id]: e.target.value }))}
                          placeholder="Buscar servicio..."
                          style={{ width: "100%", border: "none", outline: "none" }}
                        />
                      </div>

                      {(workTypesLoaded ? getVisibleWorkTypes(line.id) : []).map((wt) => (
                        <div
                          key={wt}
                          onMouseDown={() => {
                            handleInputChange(line.id, { target: { name: "work_type", value: wt } });
                            clearFieldError(line.id, "work_type");
                            setWtFilter((prev) => ({ ...prev, [line.id]: wt }));
                            setWtOpenFor(null);
                          }}
                          title={wt}
                        >
                          {wt}
                        </div>
                      ))}

                      {workTypesLoaded && getVisibleWorkTypes(line.id).length === 0 && (
                        <div style={{ padding: "8px", color: "#999" }}>Sin resultados…</div>
                      )}
                    </div>
                  )}
                </div>
              </EditableCell>

              {/* ----- Fecha (derecha) ----- */}
              <EditableCell
                style={{ ...colStyles.date, textAlign: getAlign("date") }}
                error={errors[line.id]?.date}
                errorId={`input-date-${line.id}-err`}
              >
                <DateInput
                  key={`${line.id}-${editableHeader?.allocation_period || header?.allocation_period || 'default'}-${periodChangeTrigger}`} // 🆕 Key que cambia cuando cambia el período O el trigger
                  name="date"
                  value={editFormData[line.id]?.date || ""}
                  onChange={(val) => handleDateInputChange(line.id, val)}
                  onBlur={(val) => {
                    handleDateInputBlur(line.id, val);
                    if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                  }}
                  onFocus={(e) => handleInputFocus(line.id, "date", e)}
                  onKeyDown={(e) => handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("date"))}
                  inputRef={hasRefs ? (el) => setSafeRef(line.id, "date", el) : null}
                  calendarOpen={calendarOpenFor === line.id}
                  setCalendarOpen={(open) => setCalendarOpenFor(open ? line.id : null)}
                  header={header}
                  editableHeader={editableHeader} // 🆕 Pasar editableHeader para validación en inserción
                  calendarHolidays={calendarHolidays}
                  className={`ts-input pr-icon ${errors[line.id]?.date ? 'has-error' : ''}`}
                  inputId={`input-date-${line.id}`}
                />
              </EditableCell>

              {/* ----- Cantidad (derecha) ----- */}
              <EditableCell
                style={{ ...colStyles.quantity, textAlign: getAlign("quantity"), verticalAlign: "top" }}
                error={errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id])}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <DecimalInput
                      name="quantity"
                      value={(() => {
                        const q = editFormData[line.id]?.quantity;
                        if (typeof q === "number" || typeof q === "string") return q;
                        if (q && typeof q === "object" && "value" in q) return q.value;
                        return "";
                      })()}
                      onChange={({ target: { name, value } }) => handleInputChange(line.id, { target: { name, value } })}
                      onFocus={(e) => handleInputFocus(line.id, "quantity", e)}
                      onBlur={({ target: { name, value } }) => {
                        const hasError = !!(errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id]));
                        if (hasError) {
                          const el = inputRefs?.current?.[line.id]?.["quantity"];
                          if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                        }
                        handleInputChange(line.id, { target: { name, value } });
                        if (typeof saveLineNow === 'function') saveLineNow(line.id);
                        else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                      }}
                      onKeyDown={(e) => {
                        const hasError = !!(errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id]));
                        if ((e.key === "Enter" || e.key === "Tab") && hasError) {
                          e.preventDefault();
                          const el = inputRefs?.current?.[line.id]?.["quantity"];
                          if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                          return;
                        }
                        if (e.key === "Enter" || e.key === "Tab") {
                          if (typeof saveLineNow === 'function') saveLineNow(line.id);
                          else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                        }
                        handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("quantity"));
                      }}
                      inputRef={hasRefs ? (el) => setSafeRef(line.id, "quantity", el) : null}
                      className={`ts-input ${
                        errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id])
                          ? "has-error"
                          : ""
                      }`}
                      min={0}
                      step={0.01}
                      decimals={2}
                    />
                </div>
              </EditableCell>

              {/* ----- Departamento: NO editable ----- */}
              <DepartmentCell
                line={line}
                lineIndex={lineIndex}
                colStyle={colStyles.department_code}
                align={getAlign("department_code")}
                editFormData={editFormData} // ✅ Pasar editFormData para mostrar valor actualizado
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
