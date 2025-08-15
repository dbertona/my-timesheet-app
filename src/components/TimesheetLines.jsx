// src/components/TimesheetLines.jsx
import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { parseDate, formatDate } from "../utils/dateHelpers";
import useColumnResize from "../hooks/useColumnResize";
import { supabaseClient } from "../supabaseClient";
import { useJobs, useWorkTypes, useTasks } from "../hooks/useTimesheetQueries";
import "../styles/TimesheetResponsive.css";
import "../styles/TimesheetLines.css";
import TIMESHEET_FIELDS, { TIMESHEET_LABELS, TIMESHEET_ALIGN, COL_MIN_WIDTH, COL_MAX_WIDTH, DEFAULT_COL_WIDTH } from "../constants/timesheetFields";
import ProjectCell from "./timesheet/ProjectCell";
import TaskCell from "./timesheet/TaskCell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import InlineError from "./ui/InlineError";
import { DecimalInput } from "./ui/DecimalInput";
import DateInput from "./ui/DateInput";
import EditableCell from "./ui/EditableCell";
import { VALIDATION, LABELS } from '../constants/i18n';
import { toast } from 'react-hot-toast';
import { prepareRowForDb } from '../api/timesheet';


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
  calendarHolidays,
  scheduleAutosave,
  saveLineNow,
  savingByLine = {},
  onLinesChange,
  deleteLineMutation,
  insertLineMutation,
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

  // Estado para el modal de confirmación
  const [deleteModal, setDeleteModal] = useState({ show: false, lineId: null, lineData: null });


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
  const [wtActiveIndex, setWtActiveIndex] = useState(-1); // índice del ítem activo para work_type

  // React Query: Carga y cache de proyectos por recurso (hook reutilizable)
  const jobsQuery = useJobs(header?.resource_no);
  const jobs = jobsQuery.data || [];
  const jobsLoaded = !jobsQuery.isLoading;

  // React Query: Carga y cache de servicios por recurso
  const workTypesQuery = useWorkTypes(header?.resource_no);
  const workTypes = Array.isArray(workTypesQuery.data) ? workTypesQuery.data : [];
  const workTypesLoaded = workTypesQuery.isSuccess;

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
    const filter = jobFilter[lineId] || "";
    if (!filter) return jobs;
    return jobs.filter((j) =>
      j.no.toLowerCase().includes(filter.toLowerCase()) ||
      (j.description || "").toLowerCase().includes(filter.toLowerCase())
    );
  };

  // Funciones de acciones
  const handleDeleteLine = (lineId) => {
    const lineToDelete = lines.find(line => line.id === lineId);
    if (!lineToDelete) return;

    // Mostrar modal de confirmación
    setDeleteModal({
      show: true,
      lineId: lineId,
      lineData: lineToDelete
    });
  };

  const confirmDeleteLine = () => {
    if (!deleteModal.lineId) return;

    // Eliminar línea usando la mutación
    deleteLineMutation.mutate(deleteModal.lineId);

    // Cerrar modal
    setDeleteModal({ show: false, lineId: null, lineData: null });
  };

  const cancelDeleteLine = () => {
    setDeleteModal({ show: false, lineId: null, lineData: null });
  };

  const handleDuplicateLine = (lineId) => {
    const originalLine = lines.find(line => line.id === lineId);
    if (!originalLine) return;

    // Encontrar el índice de la línea original
    const originalIndex = lines.findIndex(line => line.id === lineId);

    // Crear nueva línea con datos copiados (mantener formato de fecha original)
    const newLineData = {
      header_id: header?.id,
      job_no: originalLine.job_no,
      job_task_no: originalLine.job_task_no,
      description: `${originalLine.description || ''} (copia)`,
      work_type: originalLine.work_type,
      quantity: 0, // Resetear cantidad
      date: originalLine.date, // Mantener formato original (dd/mm/aaaa)
      department_code: originalLine.department_code,
      company: header?.company || "",
      resource_no: header?.resource_no || "",
    };

    // Preparar datos para la base de datos usando prepareRowForDb
    const preparedData = prepareRowForDb(newLineData, { header });

    // Insertar nueva línea usando React Query
    insertLineMutation.mutate(preparedData, {
      onSuccess: (newLine) => {
        // Insertar la nueva línea en la posición correcta (debajo de la original)
        const updatedLines = [...lines];
        updatedLines.splice(originalIndex + 1, 0, newLine);

        // Actualizar el estado local para mostrar la línea en la posición correcta
        if (typeof onLinesChange === 'function') {
          onLinesChange(updatedLines, editFormData, errors);
        }
      }
    });
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
  return (
    <div className="ts-responsive">
      <table ref={tableRef} className="ts-table">
        <thead>
          <tr>
            {TIMESHEET_FIELDS.map((field) => (
              <th
                key={field}
                style={{
                  minWidth: COL_MIN_WIDTH[field],
                  maxWidth: COL_MAX_WIDTH[field],
                  width: COL_MIN_WIDTH[field],
                }}
              >
                {TIMESHEET_LABELS[field] || field}
              </th>
            ))}
            <th style={{ width: 80 }}>Acciones</th>
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
                error={localErrors[line.id]?.job_no}
                handlers={{
                  handleInputChange,
                  handleInputFocus,
                  handleKeyDown,
                  setFieldError,
                  clearFieldError,
                  scheduleAutosave,
                  saveLineNow,
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
                  scheduleAutosave,
                  saveLineNow,
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
                          setFieldError(line.id, "work_type", VALIDATION.INVALID_WORK_TYPE);
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
                          setFieldError(line.id, "work_type", VALIDATION.INVALID_WORK_TYPE);
                          const el = inputRefs?.current?.[line.id]?.["work_type"];
                          if (el) setTimeout(() => { try { el.focus(); el.select(); } catch {} }, 0);
                          return;
                        }
                        // Alt + ArrowDown: abrir dropdown de servicios
                        if (e.altKey && e.key === "ArrowDown") {
                          setWtOpenFor((prev) => (prev === line.id ? null : line.id));
                          setWtActiveIndex(0);
                          e.preventDefault();
                          return;
                        }
                        // Alt + ArrowUp: cerrar dropdown
                        if (e.altKey && e.key === "ArrowUp") {
                          setWtOpenFor(null);
                          setWtActiveIndex(-1);
                          e.preventDefault();
                          return;
                        }
                        // Escape: cerrar dropdown
                        if (e.key === "Escape") {
                          setWtOpenFor(null);
                          setWtActiveIndex(-1);
                          e.preventDefault();
                          return;
                        }
                        handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("work_type"));
                      }}
                      ref={hasRefs ? (el) => setSafeRef(line.id, "work_type", el) : null}
                      className={`ts-input ${localErrors[line.id]?.work_type ? 'has-error' : ''}`}
                      autoComplete="off"
                      aria-expanded={wtOpenFor === line.id}
                      aria-haspopup="listbox"
                      aria-controls={`worktype-dropdown-${line.id}`}
                      role="combobox"
                      aria-autocomplete="list"
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
                    <div
                      className="ts-dropdown"
                      onMouseDown={(e) => e.preventDefault()}
                      id={`worktype-dropdown-${line.id}`}
                      role="listbox"
                      aria-label="Lista de tipos de trabajo"
                      onKeyDown={(e) => {
                        const items = getVisibleWorkTypes(line.id) || [];
                        if (items.length === 0) return;

                        if (e.key === "Escape") {
                          setWtOpenFor(null);
                          setWtActiveIndex(-1);
                          e.preventDefault();
                          return;
                        }

                        // Navegación con flechas
                        if (e.key === "ArrowDown") {
                          const newIndex = Math.min(wtActiveIndex + 1, items.length - 1);
                          setWtActiveIndex(newIndex);
                          e.preventDefault();
                          return;
                        }
                        if (e.key === "ArrowUp") {
                          const newIndex = Math.max(wtActiveIndex - 1, 0);
                          setWtActiveIndex(newIndex);
                          e.preventDefault();
                          return;
                        }
                        if (e.key === "Home") {
                          setWtActiveIndex(0);
                          e.preventDefault();
                          return;
                        }
                        if (e.key === "End") {
                          setWtActiveIndex(items.length - 1);
                          e.preventDefault();
                          return;
                        }

                        // Seleccionar con Enter
                        if (e.key === "Enter" && wtActiveIndex >= 0 && wtActiveIndex < items.length) {
                          const selected = items[wtActiveIndex];
                          handleInputChange(line.id, { target: { name: "work_type", value: selected } });
                          clearFieldError(line.id, "work_type");
                          setWtFilter((prev) => ({ ...prev, [line.id]: selected }));
                          setWtOpenFor(null);
                          setWtActiveIndex(-1);
                          if (typeof saveLineNow === 'function') saveLineNow(line.id);
                          else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="ts-dropdown__header">
                        <FiSearch />
                        <input
                          value={wtFilter[line.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWtFilter((prev) => ({ ...prev, [line.id]: val }));
                            setWtOpenFor((prev) => (prev === line.id ? line.id : null));
                          }}
                          placeholder={PLACEHOLDERS.WORK_TYPE_SEARCH}
                          style={{ width: "100%", border: "none", outline: "none" }}
                        />
                      </div>

                      {(workTypesLoaded ? getVisibleWorkTypes(line.id) : []).map((wt, index) => (
                        <div
                          key={wt}
                          onMouseDown={() => {
                            handleInputChange(line.id, { target: { name: "work_type", value: wt } });
                            clearFieldError(line.id, "work_type");
                            setWtFilter((prev) => ({ ...prev, [line.id]: wt }));
                            setWtOpenFor(null);
                            setWtActiveIndex(index);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Tab") {
                              handleInputChange(line.id, { target: { name: "work_type", value: wt } });
                              clearFieldError(line.id, "work_type");
                              setWtFilter((prev) => ({ ...prev, [line.id]: wt }));
                              setWtOpenFor(null);
                              setWtActiveIndex(index);
                              e.preventDefault();
                            }
                          }}
                          onMouseEnter={() => setWtActiveIndex(index)}
                          onMouseLeave={() => setWtActiveIndex(-1)}
                          aria-selected={wtActiveIndex === index}
                          role="option"
                          tabIndex={-1}
                          className={`ts-dropdown__item ${wtActiveIndex === index ? 'ts-dropdown__item--active' : ''}`}
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
                  calendarHolidays={calendarHolidays}
                  className={`ts-input pr-icon ${errors[line.id]?.date ? 'has-error' : ''}`}
                  inputId={`input-date-${line.id}`}
                />
                {savingByLine[line.id] ? (
                  <div className="ts-inline-error" style={{ marginTop: 4, background: "transparent", border: "none", padding: 0 }}>
                    <span className="ts-spinner" aria-label="Guardando…" />
                    <span style={{ color: "#666" }}>Guardando…</span>
                  </div>
                ) : null}
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
                    {savingByLine[line.id] ? (
                      <div className="ts-inline-error" style={{ marginTop: 4, background: "transparent", border: "none", padding: 0 }}>
                        <span className="ts-spinner" aria-label="Guardando…" />
                        <span style={{ color: "#666" }}>Guardando…</span>
                      </div>
                    ) : null}
                </div>
              </EditableCell>

              {/* ----- Departamento ----- */}
              <EditableCell
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
              </EditableCell>

              {/* ----- Acciones ----- */}
              <td style={{ width: 80, textAlign: "center", verticalAlign: "top", padding: "4px" }}>
                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicateLine(line.id)}
                    title="Duplicar línea"
                    className="ts-action-btn ts-action-btn--duplicate"
                    style={{
                      padding: "4px 6px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#666"
                    }}
                  >
                    📋
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLine(line.id)}
                    title="Eliminar línea"
                    className="ts-action-btn ts-action-btn--delete"
                    style={{
                      padding: "4px 6px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#dc3545"
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de confirmación de eliminación */}
      {deleteModal.show && (
        <div className="ts-modal-overlay">
          <div className="ts-modal">
            <h3>¿Desea seguir adelante y eliminar?</h3>
            <p>
              <strong>Proyecto:</strong> {deleteModal.lineData?.job_no || 'N/A'}<br />
              <strong>Tarea:</strong> {deleteModal.lineData?.job_task_no || 'N/A'}<br />
              <strong>Fecha:</strong> {deleteModal.lineData?.date || 'N/A'}
            </p>
            <div className="ts-modal-actions">
              <button onClick={confirmDeleteLine} className="ts-btn ts-btn--danger">
                Sí
              </button>
              <button onClick={cancelDeleteLine} className="ts-btn ts-btn--secondary">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
