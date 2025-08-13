import React from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";

export default function ProjectCell({
  line,
  lineIndex,
  colStyle,
  align,
  editFormData,
  inputRefs,
  hasRefs,
  setSafeRef,
  handlers,
  jobsState,
}) {
  const {
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    setFieldError,
    clearFieldError,
  } = handlers;

  const {
    jobsLoaded,
    jobFilter,
    setJobFilter,
    jobOpenFor,
    setJobOpenFor,
    getVisibleJobs,
    ensureTasksLoaded,
    findJob,
  } = jobsState;

  return (
    <td
      data-col="job_no"
      className="ts-td ts-cell"
      style={{ ...colStyle, textAlign: align }}
    >
      <div className="ts-cell">
        <div className="ts-cell">
          <input
            type="text"
            name="job_no"
            value={editFormData[line.id]?.job_no || ""}
            onChange={(e) => {
              // Solo actualizamos job_no y, si cambió, limpiamos la TAREA. No tocamos quantity.
              handleInputChange(line.id, e);
              clearFieldError(line.id, "job_no");
              setJobFilter((prev) => ({ ...prev, [line.id]: e.target.value }));

              if (e.target.value !== editFormData[line.id]?.job_no) {
                handleInputChange(line.id, {
                  target: { name: "job_task_no", value: "" },
                });
                clearFieldError(line.id, "job_task_no");
              }
            }}
            onBlur={() => {
              const raw = (editFormData[line.id]?.job_no || "").trim();
              if (!raw) return;
              const found = findJob(raw);
              if (!found) {
                setFieldError(
                  line.id,
                  "job_no",
                  "Proyecto inválido. Debe seleccionar uno de la lista."
                );
                const el = inputRefs?.current?.[line.id]?.["job_no"];
                if (el) setTimeout(() => { el.focus(); el.select(); }, 0);
                return;
              }
              if (found.no !== raw) {
                handleInputChange(line.id, {
                  target: { name: "job_no", value: found.no },
                });
              }
              clearFieldError(line.id, "job_no");
            }}
            onFocus={(e) => handleInputFocus(line.id, "job_no", e)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const list = getVisibleJobs(line.id);
                if (list.length === 1) {
                  const val = list[0].no;
                  handleInputChange(line.id, {
                    target: { name: "job_no", value: val },
                  });
                  clearFieldError(line.id, "job_no");
                  setJobFilter((prev) => ({ ...prev, [line.id]: val }));
                  setJobOpenFor(null);
                  await ensureTasksLoaded(val);
                  const el = inputRefs.current?.[line.id]?.["job_task_no"];
                  if (el) { el.focus(); el.select(); }
                  e.preventDefault();
                  return;
                }
              }
              handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("job_no"));
            }}
            ref={hasRefs ? (el) => setSafeRef(line.id, "job_no", el) : null}
            className={`ts-input`}
            autoComplete="off"
          />
          <FiChevronDown
            onMouseDown={(e) => {
              e.preventDefault();
              setJobOpenFor((prev) => (prev === line.id ? null : line.id));
            }}
            className="ts-icon ts-icon--chevron"
          />
        </div>

        {jobOpenFor === line.id && (
          <div className="ts-dropdown" onMouseDown={(e) => e.preventDefault()}>
            <div className="ts-dropdown__header">
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
                style={{ width: "100%", border: "none", outline: "none" }}
              />
            </div>

            {(jobsLoaded ? getVisibleJobs(line.id) : []).map((j) => (
              <div
                key={j.no}
                onMouseDown={async () => {
                  // Establecemos el proyecto seleccionado sin tocar otros campos.
                  handleInputChange(line.id, {
                    target: { name: "job_no", value: j.no },
                  });
                  setJobFilter((prev) => ({ ...prev, [line.id]: j.no }));
                  setJobOpenFor(null);

                  // Al cambiar de proyecto, solo reiniciamos la tarea.
                  handleInputChange(line.id, {
                    target: { name: "job_task_no", value: "" },
                  });

                  await ensureTasksLoaded(j.no);
                  const el = inputRefs.current?.[line.id]?.["job_task_no"];
                  if (el) {
                    el.focus();
                    el.select();
                  }
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
  );
}
