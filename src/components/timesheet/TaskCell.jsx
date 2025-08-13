// src/components/timesheet/TaskCell.jsx
import React from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";

export default function TaskCell({
  line,
  lineIndex,
  colStyle,
  align,
  editFormData,
  inputRefs,
  hasRefs,
  setSafeRef,
  handlers,
  tasksState,
}) {
  const {
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    setFieldError,
    clearFieldError,
  } = handlers;

  const {
    taskFilter,
    setTaskFilter,
    taskOpenFor,
    setTaskOpenFor,
    getVisibleTasks,
    ensureTasksLoaded,
    findTask,
  } = tasksState;

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
            }}
            onFocus={async (e) => {
              handleInputFocus(line.id, "job_task_no", e);
              const jobNo = editFormData[line.id]?.job_no || "";
              if (jobNo) await ensureTasksLoaded(jobNo);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const jobNo = editFormData[line.id]?.job_no || "";
                const list = getVisibleTasks(line.id, jobNo);
                if (list.length === 1) {
                  const val = list[0].no;
                  handleInputChange(line.id, {
                    target: { name: "job_task_no", value: val },
                  });
                  clearFieldError(line.id, "job_task_no");
                  setTaskFilter((prev) => ({ ...prev, [line.id]: val }));
                  setTaskOpenFor(null);
                  e.preventDefault();
                  return;
                }
              }
              handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("job_task_no"));
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
                  setTaskFilter((prev) => ({ ...prev, [line.id]: t.no }));
                  setTaskOpenFor(null);
                }}
                title={`${t.no} - ${t.description || ""}`}
              >
                <strong>{t.no}</strong>{" "}
                {t.description ? `— ${t.description}` : ""}
              </div>
            ))}

            {editFormData[line.id]?.job_no &&
              getVisibleTasks(line.id, editFormData[line.id]?.job_no).length ===
                0 && (
                <div style={{ padding: "8px", color: "#999" }}>
                  Sin resultados…
                </div>
              )}
          </div>
        )}
      </div>
    </td>
  );
}
