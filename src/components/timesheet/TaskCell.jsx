// src/components/timesheet/TaskCell.jsx
import React, { useMemo, useRef } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";
import useDropdownFilter from "../../utils/useDropdownFilter";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";

const TaskCell = ({
  line,
  lineIndex,
  colStyle,
  align,
  editFormData,
  inputRefs,
  hasRefs,
  setSafeRef,
  error,
  handlers,
  tasksState,
}) => {
  const {
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    setFieldError,
    clearFieldError,
  } = handlers;

  const { ensureTasksLoaded, findTask, tasksByJob = {} } = tasksState;
  const tasksFilter = useDropdownFilter();
  const taskFilter = tasksFilter.filterByLine;
  const setTaskFilter = tasksFilter.setFilterByLine;
  const taskOpenFor = tasksFilter.openFor;
  const setTaskOpenFor = tasksFilter.setOpenFor;
  const getVisibleTasks = (lineId, jobNo) => tasksFilter.getVisible(lineId, (tasksByJob[jobNo]||[]), (t) => `${t.no} ${t.description||""}`);

  // Virtualización siempre montada para mantener orden de hooks estable
  const parentRef = useRef(null);
  const jobNo = editFormData[line.id]?.job_no || "";
  const items = useMemo(() => (jobNo ? getVisibleTasks(line.id, jobNo) : []), [getVisibleTasks, line.id, jobNo, taskFilter?.[line.id], tasksByJob]);
  const rowVirtualizer = useVirtualizer({
    count: taskOpenFor === line.id ? items.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
  });

  return (
    <td
      data-col="job_task_no"
      className="ts-td ts-cell"
      style={{ ...colStyle, textAlign: align }}
    >
      <div className="ts-cell">
        <div className="ts-cell">
          <input
            type="text"
            name="job_task_no"
            value={editFormData[line.id]?.job_task_no || ""}
            onChange={(e) => {
              handleInputChange(line.id, e);
              clearFieldError(line.id, "job_task_no");
              setTaskFilter((prev) => ({ ...prev, [line.id]: e.target.value }));
            }}
            onBlur={async () => {
              const jobNo = editFormData[line.id]?.job_no || "";
              const raw = (editFormData[line.id]?.job_task_no || "").trim();
              if (!raw) return;
              if (jobNo) await ensureTasksLoaded(jobNo);
              const found = findTask(jobNo, raw);
              if (!found) {
                setFieldError(
                  line.id,
                  "job_task_no",
                  "Tarea inválida para el proyecto seleccionado."
                );
                const el = inputRefs?.current?.[line.id]?.["job_task_no"];
                if (el) setTimeout(() => { el.focus(); el.select(); }, 0);
                return;
              }
              if (found.no !== raw) {
                handleInputChange(line.id, {
                  target: { name: "job_task_no", value: found.no },
                });
              }
              clearFieldError(line.id, "job_task_no");
              setTaskOpenFor(null);
            }}
            onFocus={async (e) => {
              handleInputFocus(line.id, "job_task_no", e);
              const jobNo = editFormData[line.id]?.job_no || "";
              if (jobNo) await ensureTasksLoaded(jobNo);
            }}
            onKeyDown={(e) => {
              if (e.altKey && e.key === "ArrowDown") {
                setTaskOpenFor(line.id);
                e.preventDefault();
                return;
              }
              if (e.altKey && e.key === "ArrowUp") {
                setTaskOpenFor(null);
                e.preventDefault();
                return;
              }
              // 🆕 F8: copiar desde celda superior (debe ir ANTES de la navegación)
              if (e.key === "F8") {
                e.preventDefault();
                handleKeyDown(e, lineIndex, 2);
                return;
              }
              // TODAS las teclas de navegación usan la misma función
              if (e.key === "Tab" || e.key === "Enter" || e.key.startsWith("Arrow")) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                // job_task_no está en el índice 2 de TIMESHEET_FIELDS
                handleKeyDown(e, lineIndex, 2);
                return;
              }
            }}
            ref={hasRefs ? (el) => setSafeRef(line.id, "job_task_no", el) : null}
            className={`ts-input`}
            autoComplete="off"
          />
          <FiChevronDown
            onMouseDown={async (e) => {
              e.preventDefault();
              const jobNo = editFormData[line.id]?.job_no || "";
              if (jobNo) await ensureTasksLoaded(jobNo);
              setTaskOpenFor((prev) => (prev === line.id ? null : line.id));
            }}
            className="ts-icon ts-icon--chevron"
          />
        </div>

        {taskOpenFor === line.id && (
          <div className="ts-dropdown" onMouseDown={(e) => e.preventDefault()}>
            <div className="ts-dropdown__header">
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
                style={{ width: "100%", border: "none", outline: "none" }}
              />
            </div>

            <div ref={parentRef} style={{ height: 220, overflow: 'auto' }}>
              <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((v) => {
                  const t = items[v.index];
                  if (!t) return null;
                  return (
                    <div
                      key={t.no}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}
                      onMouseDown={() => {
                        handleInputChange(line.id, { target: { name: 'job_task_no', value: t.no } });
                        setTaskFilter((prev) => ({ ...prev, [line.id]: t.no }));
                        setTaskOpenFor(null);
                      }}
                      title={`${t.no} - ${t.description || ''}`}
                    >
                      <strong>{t.no}</strong> {t.description ? `— ${t.description}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {jobNo && items.length === 0 && (
              <div style={{ padding: "8px", color: "#999" }}>
                Sin resultados…
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="ts-error"><span className="ts-inline-error"><span className="ts-inline-error__dot" />{error}</span></div>
      )}
    </td>
  );
}

export default TaskCell;
