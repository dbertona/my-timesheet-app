// src/components/TimesheetLines.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDatePicker from "react-datepicker";
import { FiCalendar, FiChevronDown, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { parseDate, formatDate } from "../utils/dateHelpers";
import useColumnResize from "../hooks/useColumnResize";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetResponsive.css";
import "../styles/TimesheetLines.css";
import TIMESHEET_FIELDS, { TIMESHEET_LABELS, TIMESHEET_ALIGN, COL_MIN_WIDTH, COL_MAX_WIDTH, DEFAULT_COL_WIDTH } from "../constants/timesheetFields";
import ProjectCell from "./timesheet/ProjectCell";
import TaskCell from "./timesheet/TaskCell";


export default function TimesheetLines({
  lines = [],
  editFormData = {},
  errors = {},
  inputRefs,
  calendarOpenFor,
  setCalendarOpenFor,
  handleInputChange,
  handleDateInputChange,
  handleDateInputBlur,
  handleInputFocus,
  handleKeyDown,
  header,
  calendarHolidays = [],
}) {
  const { colStyles, onMouseDown, setWidths } = useColumnResize(
    TIMESHEET_FIELDS,
    "timesheet_column_widths",
    DEFAULT_COL_WIDTH
  );

  const hasRefs = !!inputRefs && !!inputRefs.current;
  const setSafeRef = (lineId, field, el) => {
    if (!inputRefs?.current) return;
    if (!inputRefs.current[lineId]) inputRefs.current[lineId] = {};
    inputRefs.current[lineId][field] = el;
  };

  const safeLines = Array.isArray(lines) ? lines : [];
  const tableRef = useRef(null);

  const getAlign = (key) => (TIMESHEET_ALIGN?.[key] || "left");


  // ===============================
  // Jobs & Job Tasks (combos)
  // ===============================
  const [jobs, setJobs] = useState([]); // [{no, description}]
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [jobFilter, setJobFilter] = useState({}); // { [lineId]: "filtro" }
  const [jobOpenFor, setJobOpenFor] = useState(null); // lineId con dropdown abierto

  const [tasksByJob, setTasksByJob] = useState({}); // { [job_no]: [{job_no, no, description}] }
  const [taskFilter, setTaskFilter] = useState({}); // { [lineId]: "filtro" }
  const [taskOpenFor, setTaskOpenFor] = useState(null); // lineId con dropdown abierto para tareas

  // Servicios (work_type) por recurso actual
  const [workTypes, setWorkTypes] = useState([]); // ["DEV", "CONS", ...]
  const [workTypesLoaded, setWorkTypesLoaded] = useState(false);
  const [wtFilter, setWtFilter] = useState({}); // { [lineId]: "filtro" }
  const [wtOpenFor, setWtOpenFor] = useState(null); // lineId con dropdown abierto

  // Carga de proyectos (solo "Open" y asignados al recurso actual via job_team)
  useEffect(() => {
    let cancelled = false;
    const loadJobs = async () => {
      if (!header?.resource_no) {
        setJobs([]);
        setJobsLoaded(true);
        return;
      }
      // Requiere relación FK job(no) -> job_team(job_no) en la BD
      const { data, error } = await supabaseClient
        .from("job")
        .select("no, description, status, job_team!inner(resource_no)")
        .eq("status", "Open")
        .eq("job_team.resource_no", header.resource_no)
        .order("no")
        .limit(1000);

      if (cancelled) return;
      if (error) {
        console.error("Error cargando proyectos (job):", error);
        setJobs([]);
      } else {
        setJobs((data || []).map(j => ({ no: j.no, description: j.description })));
      }
      setJobsLoaded(true);
    };
    loadJobs();
    return () => { cancelled = true; };
  }, [header?.resource_no]);

  // Carga de servicios (work_type) filtrados por recurso actual
  useEffect(() => {
    let cancelled = false;
    const loadWorkTypes = async () => {
      if (!header?.resource_no) {
        setWorkTypes([]);
        setWorkTypesLoaded(true);
        return;
      }
      const { data, error } = await supabaseClient
        .from("resource_cost")
        .select("work_type")
        .eq("resource_no", header.resource_no)
        .order("work_type")
        .limit(2000);
      if (cancelled) return;
      if (error) {
        console.error("Error cargando servicios (resource_cost):", error);
        setWorkTypes([]);
      } else {
        const list = (data || []).map((r) => r.work_type).filter(Boolean);
        const dedup = Array.from(new Set(list));
        setWorkTypes(dedup);
      }
      setWorkTypesLoaded(true);
    };
    loadWorkTypes();
    return () => { cancelled = true; };
  }, [header?.resource_no]);

  // Cargar tareas para un job y cachear
  const ensureTasksLoaded = async (jobNo) => {
    if (!jobNo) return [];
    if (tasksByJob[jobNo]) return tasksByJob[jobNo];
    const { data, error } = await supabaseClient
      .from("job_task")
      .select("job_no, no, description")
      .eq("job_no", jobNo)
      .order("no")
      .limit(1000);
    if (error) {
      console.error("Error cargando tareas (job_task):", error);
      setTasksByJob((prev) => ({ ...prev, [jobNo]: [] }));
      return [];
    }
    setTasksByJob((prev) => ({ ...prev, [jobNo]: data || [] }));
    return data || [];
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
    return workTypes.find((wt) => wt?.toLowerCase() === v) || null;
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
  return (
    <div className="ts-responsive">
      <table ref={tableRef} className="ts-table">
        <thead>
          <tr>
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
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                }}
                jobsState={{
                  jobsLoaded,
                  jobFilter,
                  setJobFilter,
                  jobOpenFor,
                  setJobOpenFor,
                  getVisibleJobs,
                  ensureTasksLoaded,
                  findJob,
                }}
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
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                }}
                tasksState={{
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
              <td
                data-col="description"
                className="ts-td"
                style={{ ...colStyles.description, textAlign: getAlign("description") }}
              >
                <input
                  type="text"
                  name="description"
                  value={editFormData[line.id]?.description || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "description", e)}
                  onKeyDown={(e) => handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("description"))}
                  ref={hasRefs ? (el) => setSafeRef(line.id, "description", el) : null}
                  className="ts-input"
                />
              </td>

              {/* ----- Servicio (work_type): combo por recurso ----- */}
              <td
                data-col="work_type"
                className="ts-td ts-cell"
                style={{ ...colStyles.work_type, textAlign: getAlign("work_type") }}
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
                      }}
                      onFocus={(e) => {
                        handleInputFocus(line.id, "work_type", e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const list = getVisibleWorkTypes(line.id);
                          if (list.length === 1) {
                            const val = list[0];
                            handleInputChange(line.id, { target: { name: "work_type", value: val } });
                            clearFieldError(line.id, "work_type");
                            setWtFilter((prev) => ({ ...prev, [line.id]: val }));
                            setWtOpenFor(null);
                            e.preventDefault();
                            return;
                          }
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
                {localErrors[line.id]?.work_type && (
                  <div className="ts-error">
                    {localErrors[line.id].work_type}
                  </div>
                )}
              </td>

              {/* ----- Fecha (derecha) ----- */}
              <td
                data-col="date"
                className="ts-td ts-cell"
                style={{ ...colStyles.date, textAlign: getAlign("date") }}
              >
                <div className="ts-cell" style={{ width: "100%", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    name="date"
                    value={editFormData[line.id]?.date || ""}
                    onChange={(e) => handleDateInputChange(line.id, e.target.value)}
                    onBlur={(e) => handleDateInputBlur(line.id, e.target.value)}
                    onFocus={(e) => handleInputFocus(line.id, "date", e)}
                    onKeyDown={(e) => handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("date"))}
                    ref={hasRefs ? (el) => setSafeRef(line.id, "date", el) : null}
                    className={`ts-input pr-icon ${errors[line.id]?.date ? 'has-error' : ''}`}
                    autoComplete="off"
                    id={`input-date-${line.id}`}
                  />
                  <FiCalendar
                    onClick={() => setCalendarOpenFor(line.id)}
                    className="ts-icon ts-icon--calendar"
                    tabIndex={-1}
                    aria-label="Abrir calendario"
                  />
                  {calendarOpenFor === line.id && (
                    <div className="ts-datepop">
                      <ReactDatePicker
                        selected={parseDate(editFormData[line.id]?.date)}
                        onChange={(date) => {
                          const formatted = formatDate(date);
                          handleDateInputChange(line.id, formatted);
                          handleDateInputBlur(line.id, formatted);
                          setCalendarOpenFor(null);
                        }}
                        onClickOutside={() => setCalendarOpenFor(null)}
                        dateFormat="dd/MM/yyyy"
                        minDate={header ? new Date(header.from_date) : null}
                        maxDate={header ? new Date(header.to_date) : null}
                        filterDate={(date) => {
                          if (!calendarHolidays || calendarHolidays.length === 0) return true;
                          const dayISO = format(date, "yyyy-MM-dd");
                          return !calendarHolidays.some((h) => {
                            const hISO = typeof h.day === "string" ? h.day : format(h.day, "yyyy-MM-dd");
                            return hISO === dayISO && h.holiday === true;
                          });
                        }}
                        inline
                      />
                    </div>
                  )}
                </div>

                {errors[line.id]?.date && (
                  <div className="ts-error">
                    {errors[line.id].date}
                  </div>
                )}
              </td>

              {/* ----- Cantidad (derecha) ----- */}
              <td
                data-col="quantity"
                className="ts-td"
                style={{ ...colStyles.quantity, textAlign: getAlign("quantity"), verticalAlign: "top" }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <input
                    type="text"
                    name="quantity"
                    value={(() => {
                      const q = editFormData[line.id]?.quantity;
                      if (typeof q === "number" || typeof q === "string") return q;
                      if (q && typeof q === "object" && "value" in q) return q.value;
                      return "";
                    })()}
                    onChange={(e) => {
                      handleInputChange(line.id, {
                        target: { name: "quantity", value: e.target.value.replace(",", ".") },
                      });
                    }}
                    onFocus={(e) => handleInputFocus(line.id, "quantity", e)}
                    onBlur={(e) => {
                      const hasError = !!(errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id]));
                      if (hasError) {
                        const el = inputRefs?.current?.[line.id]?.["quantity"];
                        if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                      }
                    }}
                    onKeyDown={(e) => {
                      const hasError = !!(errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id]));
                      if ((e.key === "Enter" || e.key === "Tab") && hasError) {
                        e.preventDefault();
                        const el = inputRefs?.current?.[line.id]?.["quantity"];
                        if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                        return;
                      }
                      handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("quantity"));
                    }}
                    ref={hasRefs ? (el) => setSafeRef(line.id, "quantity", el) : null}
                    className={`ts-input ${
                      errors[line.id]?.quantity || (typeof errors[line.id] === "string" && errors[line.id])
                        ? "has-error"
                        : ""
                    }`}
                    autoComplete="off"
                  />

                  {/* Mensaje de error debajo del input, en la misma celda */}
                  {errors[line.id]?.quantity && (
                    <span style={{ color: "red", fontSize: "0.8em", marginTop: 2, position: "static", alignSelf: "flex-start" }}>
                      {errors[line.id].quantity}
                    </span>
                  )}
                  {typeof errors[line.id] === "string" && errors[line.id] && (
                    <span style={{ color: "red", fontSize: "0.8em", marginTop: 2, position: "static", alignSelf: "flex-start" }}>
                      {errors[line.id]}
                    </span>
                  )}
                </div>
              </td>

              {/* ----- Departamento ----- */}
              <td
                data-col="department_code"
                className="ts-td"
                style={{ ...colStyles.department_code, textAlign: getAlign("department_code") }}
              >
                <input
                  type="text"
                  name="department_code"
                  value={editFormData[line.id]?.department_code || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "department_code", e)}
                  onKeyDown={(e) => handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("department_code"))}
                  ref={hasRefs ? (el) => setSafeRef(line.id, "department_code", el) : null}
                  className="ts-input"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
