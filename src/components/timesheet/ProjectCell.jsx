import React, { useEffect, useMemo, useRef } from "react";
import useDropdownFilter from "../../utils/useDropdownFilter";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";
import { PLACEHOLDERS } from '../../constants/i18n';

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
    scheduleAutosave,
    saveLineNow,
  } = handlers;

  const { jobsLoaded, ensureTasksLoaded, findJob, jobs = [] } = jobsState;
  const jobsFilter = useDropdownFilter();
  const jobFilter = jobsFilter.filterByLine;
  const setJobFilter = jobsFilter.setFilterByLine;
  const jobOpenFor = jobsFilter.openFor;
  const setJobOpenFor = jobsFilter.setOpenFor;
  const activeIndex = jobsFilter.activeIndex;
  const setActiveIndex = jobsFilter.setActiveIndex;
  const handleKeyNavigation = jobsFilter.handleKeyNavigation;
  const handleEscape = jobsFilter.handleEscape;
  const getVisibleJobs = (lineId) => jobsFilter.getVisible(lineId, jobs, (j) => `${j.no} ${j.description || ""}`);

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
              if (typeof saveLineNow === 'function') saveLineNow(line.id);
              else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
            }}
            onFocus={(e) => handleInputFocus(line.id, "job_no", e)}
            onKeyDown={async (e) => {
              if (e.altKey && e.key === "ArrowDown") {
                setJobOpenFor(line.id);
                setActiveIndex(0);
                e.preventDefault();
                return;
              }
              if (e.altKey && e.key === "ArrowUp") {
                setJobOpenFor(null);
                setActiveIndex(-1);
                e.preventDefault();
                return;
              }
              if (e.key === "Escape") {
                handleEscape();
                e.preventDefault();
                return;
              }
              if (e.key === "Enter") {
                const list = getVisibleJobs(line.id) || [];
                const candidate = list[0];
                if (candidate) {
                  const val = candidate.no;
                  handleInputChange(line.id, { target: { name: "job_no", value: val } });
                  clearFieldError(line.id, "job_no");
                  setJobFilter((prev) => ({ ...prev, [line.id]: val }));
                  setJobOpenFor(null);
                  setActiveIndex(-1);
                  await ensureTasksLoaded(val);
                  if (typeof saveLineNow === 'function') saveLineNow(line.id);
                  else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
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
            aria-expanded={jobOpenFor === line.id}
            aria-haspopup="listbox"
            aria-controls={`job-dropdown-${line.id}`}
            role="combobox"
            aria-autocomplete="list"
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
          <div
            className="ts-dropdown"
            onMouseDown={(e) => e.preventDefault()}
            id={`job-dropdown-${line.id}`}
            role="listbox"
            aria-label="Lista de proyectos"
            onKeyDown={(e) => {
              const items = getVisibleJobs(line.id) || [];
              if (items.length === 0) return;

              if (e.key === "Escape") {
                handleEscape();
                e.preventDefault();
                return;
              }

              const newIndex = handleKeyNavigation(e.key, items, activeIndex);
              if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
                e.preventDefault();
                return;
              }

              if (e.key === "Enter" && activeIndex >= 0 && activeIndex < items.length) {
                const selected = items[activeIndex];
                handleInputChange(line.id, { target: { name: 'job_no', value: selected.no } });
                setJobFilter((prev) => ({ ...prev, [line.id]: selected.no }));
                setJobOpenFor(null);
                setActiveIndex(-1);
                ensureTasksLoaded(selected.no);
                if (typeof saveLineNow === 'function') saveLineNow(line.id);
                else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                e.preventDefault();
              }
            }}
          >
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
                placeholder={PLACEHOLDERS.PROJECT_SEARCH}
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
                    const isActive = v.index === activeIndex;
                    return (
                      <div
                        key={j.no}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${v.start}px)`,
                          backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                          outline: isActive ? '2px solid #2196f3' : 'none'
                        }}
                        onMouseDown={async () => {
                          handleInputChange(line.id, { target: { name: 'job_no', value: j.no } });
                          setJobFilter((prev) => ({ ...prev, [line.id]: j.no }));
                          setJobOpenFor(null);
                          setActiveIndex(-1);
                          handleInputChange(line.id, { target: { name: 'job_task_no', value: '' } });
                          await ensureTasksLoaded(j.no);
                          if (typeof saveLineNow === 'function') saveLineNow(line.id);
                          else if (typeof scheduleAutosave === 'function') scheduleAutosave(line.id);
                          const el = inputRefs.current?.[line.id]?.['job_task_no'];
                          if (el) { el.focus(); el.select(); }
                        }}
                        title={`${j.no} - ${j.description || ''}`}
                        role="option"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
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
