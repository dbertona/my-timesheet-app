// src/components/TimesheetLines.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDatePicker from "react-datepicker";
import { FiCalendar, FiChevronDown, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { parseDate, formatDate } from "../utils/dateHelpers";
import useColumnResize from "../hooks/useColumnResize";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetResponsive.css";
import TIMESHEET_FIELDS, {
  TIMESHEET_LABELS,
  TIMESHEET_ALIGN,
  COL_MIN_WIDTH,
  COL_MAX_WIDTH,
  DEFAULT_COL_WIDTH,
} from "../constants/timesheetFields";

const resizerStyle = {
  position: "absolute",
  right: 0,
  top: 0,
  width: 6,
  height: "100%",
  cursor: "col-resize",
  userSelect: "none",
  touchAction: "none",
};

const baseInputStyle = {
  width: "100%",
  height: "100%",
  border: "none",
  padding: "4px 6px",
  boxSizing: "border-box",
  outline: "none",
  outlineColor: "transparent",
  outlineOffset: 0,
  boxShadow: "none",
  fontSize: "inherit",
  fontFamily: "inherit",
  backgroundColor: "transparent",
  cursor: "text",
};

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

  const getAlign = (key) => TIMESHEET_ALIGN?.[key] || "left";

  const thBaseStyle = { border: "1px solid #ddd", padding: 8, textAlign: "center" };
  const tdBaseStyle = { border: "1px solid #ddd", padding: 8 };

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

  // Carga inicial de proyectos
  useEffect(() => {
    const loadJobs = async () => {
      const { data, error } = await supabaseClient
        .from("job")
        .select("no, description")
        .order("no")
        .limit(500);
      if (error) {
        console.error("Error cargando proyectos (job):", error);
        setJobs([]);
      } else {
        setJobs(data || []);
      }
      setJobsLoaded(true);
    };
    loadJobs();
  }, []);

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
      <table
        ref={tableRef}
        style={{
          borderCollapse: "collapse",
          width: "100%",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            {TIMESHEET_FIELDS.map((key) => (
              <th
                key={key}
                data-col={key}
                style={{
                  ...thBaseStyle,
                  ...colStyles[key],
                  position: "relative",
                  textAlign: "center",
                }}
              >
                {TIMESHEET_LABELS?.[key] || key}
                <span
                  style={resizerStyle}
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
              <td
                data-col="job_no"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.job_no,
                  position: "relative",
                  textAlign: getAlign("job_no"),
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      name="job_no"
                      value={editFormData[line.id]?.job_no || ""}
                      onChange={(e) => {
                        handleInputChange(line.id, e);
                        setJobFilter((prev) => ({
                          ...prev,
                          [line.id]: e.target.value,
                        }));
                        if (e.target.value !== editFormData[line.id]?.job_no) {
                          handleInputChange(line.id, {
                            target: { name: "job_task_no", value: "" },
                          });
                        }
                      }}
                      onFocus={(e) => {
                        handleInputFocus(line.id, "job_no", e);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const list = getVisibleJobs(line.id);
                          if (list.length === 1) {
                            const val = list[0].no;
                            handleInputChange(line.id, {
                              target: { name: "job_no", value: val },
                            });
                            setJobFilter((prev) => ({
                              ...prev,
                              [line.id]: val,
                            }));
                            setJobOpenFor(null);
                            await ensureTasksLoaded(val);
                            const el =
                              inputRefs.current?.[line.id]?.["job_task_no"];
                            if (el) {
                              el.focus();
                              el.select();
                            }
                            e.preventDefault();
                            return;
                          }
                        }
                        handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("job_no"));
                      }}
                      ref={
                        hasRefs
                          ? (el) => setSafeRef(line.id, "job_no", el)
                          : null
                      }
                      style={{
                        ...baseInputStyle,
                        paddingRight: 24,
                        textAlign: getAlign("job_no"),
                      }}
                      autoComplete="off"
                    />
                    <FiChevronDown
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setJobOpenFor((prev) =>
                          prev === line.id ? null : line.id
                        );
                      }}
                      title="Abrir lista de proyectos"
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "#4A90E2",
                        fontSize: 16,
                      }}
                    />
                  </div>

                  {jobOpenFor === line.id && (
                    <div
                      className="ts-dropdown"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "calc(100% + 4px)",
                        width: "max(100%, 420px)",
                        minWidth: 420,
                        maxHeight: 360,
                        overflowY: "auto",
                        background: "white",
                        border: "1px solid #ccc",
                        boxShadow: "0 6px 16px rgba(0,0,0,.12)",
                        zIndex: 1000,
                        fontSize: 14,
                        lineHeight: 1.35,
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {/* búsqueda */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 8px",
                          borderBottom: "1px solid #eee",
                          position: "sticky",
                          top: 0,
                          background: "white",
                        }}
                      >
                        <FiSearch />
                        <input
                          value={jobFilter[line.id] || ""}
                          onChange={(e) =>
                            setJobFilter((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                          placeholder="Buscar proyecto..."
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                          }}
                        />
                      </div>

                      {(jobsLoaded ? getVisibleJobs(line.id) : []).map((j) => (
                        <div
                          key={j.no}
                          onMouseDown={async () => {
                            handleInputChange(line.id, {
                              target: { name: "job_no", value: j.no },
                            });
                            setJobFilter((prev) => ({
                              ...prev,
                              [line.id]: j.no,
                            }));
                            setJobOpenFor(null);
                            handleInputChange(line.id, {
                              target: { name: "job_task_no", value: "" },
                            });
                            await ensureTasksLoaded(j.no);
                            const el =
                              inputRefs.current?.[line.id]?.["job_task_no"];
                            if (el) {
                              el.focus();
                              el.select();
                            }
                          }}
                          style={{
                            padding: "8px 10px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={`${j.no} - ${j.description || ""}`}
                        >
                          <strong>{j.no}</strong>{" "}
                          {j.description ? `— ${j.description}` : ""}
                        </div>
                      ))}

                      {jobsLoaded && getVisibleJobs(line.id).length === 0 && (
                        <div style={{ padding: "8px", color: "#999" }}>
                          Sin resultados…
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>

              {/* ----- TAREA: combo dependiente ----- */}
              <td
                data-col="job_task_no"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.job_task_no,
                  position: "relative",
                  textAlign: getAlign("job_task_no"),
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      name="job_task_no"
                      value={editFormData[line.id]?.job_task_no || ""}
                      onChange={(e) => {
                        handleInputChange(line.id, e);
                        setTaskFilter((prev) => ({
                          ...prev,
                          [line.id]: e.target.value,
                        }));
                      }}
                      onFocus={(e) => {
                        handleInputFocus(line.id, "job_task_no", e);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const jobNo = editFormData[line.id]?.job_no || "";
                          if (jobNo && !tasksByJob[jobNo]) {
                            await ensureTasksLoaded(jobNo);
                          }
                          const list = getVisibleTasks(line.id, jobNo);
                          if (list.length === 1) {
                            const val = list[0].no;
                            handleInputChange(line.id, {
                              target: { name: "job_task_no", value: val },
                            });
                            setTaskFilter((prev) => ({
                              ...prev,
                              [line.id]: val,
                            }));
                            setTaskOpenFor(null);
                            e.preventDefault();
                            return;
                          }
                        }
                        handleKeyDown(
                          e,
                          lineIndex,
                          TIMESHEET_FIELDS.indexOf("job_task_no")
                        );
                      }}
                      ref={
                        hasRefs
                          ? (el) => setSafeRef(line.id, "job_task_no", el)
                          : null
                      }
                      style={{
                        ...baseInputStyle,
                        paddingRight: 24,
                        textAlign: getAlign("job_task_no"),
                      }}
                      autoComplete="off"
                    />
                    <FiChevronDown
                      onMouseDown={async (e) => {
                        e.preventDefault();
                        const jobNo = editFormData[line.id]?.job_no || "";
                        if (jobNo) await ensureTasksLoaded(jobNo);
                        setTaskOpenFor((prev) =>
                          prev === line.id ? null : line.id
                        );
                      }}
                      title="Abrir lista de tareas"
                      style={{
                        position: "absolute",
                        right: 6,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "#4A90E2",
                        fontSize: 16,
                      }}
                    />
                  </div>

                  {taskOpenFor === line.id && (
                    <div
                      className="ts-dropdown"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "calc(100% + 4px)",
                        width: "max(100%, 420px)",
                        minWidth: 420,
                        maxHeight: 360,
                        overflowY: "auto",
                        background: "white",
                        border: "1px solid #ccc",
                        boxShadow: "0 6px 16px rgba(0,0,0,.12)",
                        zIndex: 1000,
                        fontSize: 14,
                        lineHeight: 1.35,
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {/* búsqueda */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 8px",
                          borderBottom: "1px solid #eee",
                          position: "sticky",
                          top: 0,
                          background: "white",
                        }}
                      >
                        <FiSearch />
                        <input
                          value={taskFilter[line.id] || ""}
                          onChange={(e) =>
                            setTaskFilter((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                          placeholder="Buscar tarea..."
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                          }}
                        />
                      </div>

                      {(editFormData[line.id]?.job_no
                        ? getVisibleTasks(line.id, editFormData[line.id]?.job_no)
                        : []
                      ).map((t) => (
                        <div
                          key={t.no}
                          onMouseDown={() => {
                            handleInputChange(line.id, {
                              target: { name: "job_task_no", value: t.no },
                            });
                            setTaskFilter((prev) => ({
                              ...prev,
                              [line.id]: t.no,
                            }));
                            setTaskOpenFor(null);
                          }}
                          style={{
                            padding: "8px 10px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={`${t.no} - ${t.description || ""}`}
                        >
                          <strong>{t.no}</strong>{" "}
                          {t.description ? `— ${t.description}` : ""}
                        </div>
                      ))}

                      {editFormData[line.id]?.job_no &&
                        getVisibleTasks(
                          line.id,
                          editFormData[line.id]?.job_no
                        ).length === 0 && (
                          <div style={{ padding: "8px", color: "#999" }}>
                            Sin resultados…
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </td>

              {/* ----- Descripción ----- */}
              <td
                data-col="description"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.description,
                  textAlign: getAlign("description"),
                }}
              >
                <input
                  type="text"
                  name="description"
                  value={editFormData[line.id]?.description || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "description", e)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("description"))
                  }
                  ref={
                    hasRefs
                      ? (el) => setSafeRef(line.id, "description", el)
                      : null
                  }
                  style={{ ...baseInputStyle, textAlign: getAlign("description") }}
                />
              </td>

              {/* ----- Tipo trabajo ----- */}
              <td
                data-col="work_type"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.work_type,
                  textAlign: getAlign("work_type"),
                }}
              >
                <input
                  type="text"
                  name="work_type"
                  value={editFormData[line.id]?.work_type || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "work_type", e)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"))
                  }
                  ref={
                    hasRefs ? (el) => setSafeRef(line.id, "work_type", el) : null
                  }
                  style={{ ...baseInputStyle, textAlign: getAlign("work_type") }}
                />
              </td>

              {/* ----- Cantidad (derecha) ----- */}
              <td
                data-col="quantity"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.quantity,
                  textAlign: getAlign("quantity"),
                }}
              >
                <input
                  type="text"
                  name="quantity"
                  value={editFormData[line.id]?.quantity ?? ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "quantity", e)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("quantity"))
                  }
                  ref={
                    hasRefs ? (el) => setSafeRef(line.id, "quantity", el) : null
                  }
                  style={{ ...baseInputStyle, textAlign: getAlign("quantity") }}
                />
              </td>

              {/* ----- Fecha (derecha) ----- */}
              <td
                data-col="date"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.date,
                  position: "relative",
                  textAlign: getAlign("date"),
                }}
              >
                <div
                  style={{
                    width: "100%",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    name="date"
                    value={editFormData[line.id]?.date || ""}
                    onChange={(e) =>
                      handleDateInputChange(line.id, e) // evento → el padre lo normaliza en estado
                    }
                    onBlur={() => handleDateInputBlur(line.id)} // valida/normaliza en blur
                    onFocus={(e) => handleInputFocus(line.id, "date", e)}
                    onKeyDown={(e) =>
                      handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("date"))
                    }
                    ref={
                      hasRefs ? (el) => setSafeRef(line.id, "date", el) : null
                    }
                    style={{
                      ...baseInputStyle,
                      padding: "4px 26px 4px 6px",
                      textAlign: getAlign("date"),
                    }}
                    autoComplete="off"
                    id={`input-date-${line.id}`}
                  />
                  <FiCalendar
                    onClick={() => setCalendarOpenFor(line.id)}
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#4A90E2",
                      fontSize: 18,
                    }}
                    tabIndex={-1}
                    aria-label="Abrir calendario"
                  />
                  {calendarOpenFor === line.id && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 32,
                        zIndex: 1000,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
                        background: "white",
                      }}
                      onMouseDown={(e) => e.preventDefault()} // evita blur al hacer click dentro
                    >
                      <ReactDatePicker
                        inline
                        selected={parseDate(editFormData[line.id]?.date)}
                        onChange={(dateObj) => {
                          // Date → el padre lo lleva a dd/MM/yyyy en estado
                          handleDateInputChange(line.id, dateObj);
                          // blur: valida/normaliza (NO guarda)
                          handleDateInputBlur(line.id);
                          setCalendarOpenFor(null);
                        }}
                        onClickOutside={() => setCalendarOpenFor(null)}
                        dateFormat="dd/MM/yyyy"
                        minDate={header?.from_date ? parseDate(header.from_date) : null}
                        maxDate={header?.to_date ? parseDate(header.to_date) : null}
                        filterDate={(date) => {
                          if (!calendarHolidays || calendarHolidays.length === 0)
                            return true;
                          const dayISO = format(date, "yyyy-MM-dd");
                          return !calendarHolidays.some((h) => {
                            const hISO =
                              typeof h.day === "string"
                                ? h.day
                                : format(h.day, "yyyy-MM-dd");
                            return hISO === dayISO && h.holiday === true;
                          });
                        }}
                      />
                    </div>
                  )}
                </div>

                {errors[line.id]?.date && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      color: "red",
                      fontSize: "0.8em",
                      backgroundColor: "#ffe6e6",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      zIndex: 1,
                    }}
                  >
                    {errors[line.id].date}
                  </div>
                )}
              </td>

              {/* ----- Departamento ----- */}
              <td
                data-col="department_code"
                style={{
                  ...tdBaseStyle,
                  ...colStyles.department_code,
                  textAlign: getAlign("department_code"),
                }}
              >
                <input
                  type="text"
                  name="department_code"
                  value={editFormData[line.id]?.department_code || ""}
                  onChange={(e) => handleInputChange(line.id, e)}
                  onFocus={(e) => handleInputFocus(line.id, "department_code", e)}
                  onKeyDown={(e) =>
                    handleKeyDown(
                      e,
                      lineIndex,
                      TIMESHEET_FIELDS.indexOf("department_code")
                    )
                  }
                  ref={
                    hasRefs
                      ? (el) => setSafeRef(line.id, "department_code", el)
                      : null
                  }
                  style={{
                    ...baseInputStyle,
                    textAlign: getAlign("department_code"),
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
