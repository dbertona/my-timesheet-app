import React, { useEffect, useMemo, useRef, useState } from "react";
import useDropdownFilter from "../../utils/useDropdownFilter";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";
import { fetchJobStatus } from "../../api/jobs";

export default function ProjectCell({
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
  jobsState,
}) {
  const {
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    setFieldError,
    clearFieldError,
  } = handlers;

  const { jobsLoaded, ensureTasksLoaded, findJob, jobs = [] } = jobsState;
  const jobsFilter = useDropdownFilter();
  const jobFilter = jobsFilter.filterByLine;
  const setJobFilter = jobsFilter.setFilterByLine;
  const jobOpenFor = jobsFilter.openFor;
  const setJobOpenFor = jobsFilter.setOpenFor;
  const getVisibleJobs = (lineId) => jobsFilter.getVisible(lineId, jobs, (j) => `${j.no} ${j.description || ""}`);

  // Estado para el status del proyecto seleccionado
  const [projectStatus, setProjectStatus] = useState(null);

  // Prefetch: cuando se abre el dropdown de proyectos o cambia el filtro,
  // pre-cargamos tareas de los primeros candidatos visibles (hasta 5) para
  // que el despliegue de tareas sea inmediato al seleccionar.
  useEffect(() => {
    if (jobOpenFor !== line.id || !jobsLoaded) return;
    try {
      const candidates = (getVisibleJobs(line.id) || []).slice(0, 5);
      candidates.forEach((j) => {
        if (j?.no) Promise.resolve(ensureTasksLoaded(j.no)).catch(() => {});
      });
    } catch {}
    // Dependemos del valor del filtro específico de esta línea para reaccionar
    // a los cambios que hace el usuario al escribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobOpenFor, jobsLoaded, jobFilter?.[line.id]]);

  // Verificar el status del proyecto cuando cambie
  useEffect(() => {
    const currentJobNo = editFormData[line.id]?.job_no;
    if (currentJobNo) {
      fetchJobStatus(currentJobNo)
        .then(status => setProjectStatus(status))
        .catch(() => setProjectStatus(null));
    } else {
      setProjectStatus(null);
    }
  }, [editFormData[line.id]?.job_no, line.id]);

  // Virtualización: hooks deben llamarse siempre, nunca condicionalmente
  const parentRef = useRef(null);
  const items = useMemo(() => getVisibleJobs(line.id) || [], [getVisibleJobs, line.id, jobFilter?.[line.id], jobsLoaded, jobs]);
  const rowVirtualizer = useVirtualizer({
    count: jobOpenFor === line.id && jobsLoaded ? items.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
  });

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
              setJobOpenFor(null);
            }}
            onFocus={(e) => handleInputFocus(line.id, "job_no", e)}
            onKeyDown={async (e) => {
              if (e.altKey && e.key === "ArrowDown") {
                setJobOpenFor(line.id);
                e.preventDefault();
                return;
              }
              if (e.altKey && e.key === "ArrowUp") {
                setJobOpenFor(null);
                e.preventDefault();
                return;
              }
              // TODAS las teclas de navegación usan la misma función
              if (e.key === "Tab" || e.key === "Enter" || e.key.startsWith("Arrow")) {
                e.preventDefault(); // Prevenir comportamiento por defecto
                // job_no está en el índice 0 de TIMESHEET_FIELDS
                handleKeyDown(e, lineIndex, 0);
                return;
              }
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

        {/* Aviso de proyecto completado o perdido */}
        {editFormData[line.id]?.job_no && projectStatus && (projectStatus === 'Completed' || projectStatus === 'Lost') && (
          <div className="ts-project-status-warning">
            <span className="ts-project-status-warning__icon">⚠️</span>
            <span className="ts-project-status-warning__text">
              Proyecto {projectStatus === 'Completed' ? 'Completado' : 'Perdido'}
            </span>
          </div>
        )}

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
              {!jobsLoaded && <span className="ts-spinner" aria-label="Cargando" />}
            </div>
            {!jobsLoaded ? (
              <div style={{ padding: "8px", color: "#999" }}>Cargando…</div>
            ) : (
              <div ref={parentRef} style={{ height: 220, overflow: 'auto' }}>
                <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((v) => {
                    const j = items[v.index];
                    return (
                      <div
                        key={j.no}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}
                        onMouseDown={async () => {
                          handleInputChange(line.id, { target: { name: 'job_no', value: j.no } });
                          setJobFilter((prev) => ({ ...prev, [line.id]: j.no }));
                          setJobOpenFor(null);
                          handleInputChange(line.id, { target: { name: 'job_task_no', value: '' } });
                          await ensureTasksLoaded(j.no);
                          const el = inputRefs.current?.[line.id]?.['job_task_no'];
                          if (el) { el.focus(); el.select(); }
                        }}
                        title={`${j.no} - ${j.description || ''}`}
                      >
                        <strong>{j.no}</strong> {j.description ? `— ${j.description}` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {jobsLoaded && items.length === 0 && (
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
