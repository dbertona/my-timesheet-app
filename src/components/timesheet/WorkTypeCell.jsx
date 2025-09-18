// src/components/timesheet/WorkTypeCell.jsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch } from "react-icons/fi";

export default function WorkTypeCell({
  line,
  lineIndex,
  colStyle,
  align,
  editFormData,
  inputRefs,
  hasRefs,
  setSafeRef,
  error,
  isEditable,
  handlers,
  wtState,
  saving,
}) {
  const {
    handleInputChange,
    handleInputFocus,
    handleKeyDown,
    setFieldError,
    clearFieldError,
  } = handlers;

  const {
    workTypesLoaded,
    workTypes = [],
    wtFilter,
    setWtFilter,
    wtOpenFor,
    setWtOpenFor,
    findWorkType,
  } = wtState;

  const { saveLineNow, scheduleAutosave } = saving || {};

  const cellWrapperRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(null);

  // Posicionamiento inteligente del dropdown (portal-like)
  useLayoutEffect(() => {
    const updateRect = () => {
      if (wtOpenFor !== line.id) return;
      const el = cellWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 220;
      const dropdownWidth = Math.max(rect.width, 420);
      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;
      let maxHeight = dropdownHeight;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top + window.scrollY - dropdownHeight;
        if (top < 0) top = 0;
      } else if (spaceBelow < dropdownHeight) {
        maxHeight = Math.max(50, spaceBelow - 10);
      }
      const maxLeft = window.scrollX + viewportWidth - dropdownWidth - 8;
      const minLeft = window.scrollX + 8;
      left = Math.max(minLeft, Math.min(left, maxLeft));
      setDropdownRect({ left, top, width: dropdownWidth, maxHeight });
    };
    updateRect();
    if (wtOpenFor === line.id) {
      window.addEventListener("scroll", updateRect, true);
      window.addEventListener("resize", updateRect);
    }
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [wtOpenFor, line.id]);

  return (
    <td className="ts-td" style={{ ...colStyle, textAlign: align }}>
      {isEditable ? (
        <div className="ts-cell" ref={cellWrapperRef} data-line-id={line.id}>
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
                if (!raw) return;
                const found = findWorkType(raw);
                if (!found) {
                  setFieldError(
                    line.id,
                    "work_type",
                    "Servicio inválido. Debe seleccionar uno de la lista."
                  );
                  const el = inputRefs?.current?.[line.id]?.["work_type"];
                  if (el)
                    setTimeout(() => {
                      try { el.focus(); el.select(); } catch {
                        /* ignore */
                      }
                    }, 0);
                  return;
                }
                if (found !== raw) {
                  handleInputChange(line.id, {
                    target: { name: "work_type", value: found },
                  });
                }
                clearFieldError(line.id, "work_type");
                if (typeof saveLineNow === "function") saveLineNow(line.id);
                else if (typeof scheduleAutosave === "function") scheduleAutosave(line.id);
              }}
              onFocus={(e) => handleInputFocus(line.id, "work_type", e)}
              onKeyDown={(e) => {
                const isAdvance = e.key === "Enter" || e.key === "Tab";
                if (isAdvance) {
                  const raw = (editFormData[line.id]?.work_type || "").trim();
                  if (!raw) {
                    clearFieldError(line.id, "work_type");
                    if (typeof saveLineNow === "function") saveLineNow(line.id);
                    else if (typeof scheduleAutosave === "function") scheduleAutosave(line.id);
                    handleKeyDown(e, lineIndex, 0);
                    return;
                  }
                  const found = findWorkType(raw);
                  if (found) {
                    if (found !== raw) {
                      handleInputChange(line.id, { target: { name: "work_type", value: found } });
                    }
                    clearFieldError(line.id, "work_type");
                    setWtFilter((prev) => ({ ...prev, [line.id]: found }));
                    setWtOpenFor(null);
                    if (typeof saveLineNow === "function") saveLineNow(line.id);
                    else if (typeof scheduleAutosave === "function") scheduleAutosave(line.id);
                    e.preventDefault();
                    handleKeyDown(e, lineIndex, 0);
                    return;
                  }
                  e.preventDefault();
                  setFieldError(
                    line.id,
                    "work_type",
                    "Servicio inválido. Debe seleccionar uno de la lista."
                  );
                  const el = inputRefs?.current?.[line.id]?.["work_type"];
                  if (el)
                    setTimeout(() => {
                      try { el.focus(); el.select(); } catch {
                        /* ignore */
                      }
                    }, 0);
                  return;
                }
                if (e.altKey && e.key === "ArrowDown") {
                  setWtOpenFor((prev) => (prev === line.id ? null : line.id));
                  e.preventDefault();
                  return;
                }
                handleKeyDown(e, lineIndex, 0);
              }}
              ref={hasRefs ? (el) => setSafeRef(line.id, "work_type", el) : null}
              className={`ts-input ${error ? "has-error" : ""}`}
              autoComplete="off"
              style={{ textAlign: "inherit !important" }}
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
              style={{
                position: "fixed",
                left: dropdownRect?.left ?? 0,
                top: dropdownRect?.top ?? 0,
                width: dropdownRect?.width ?? 420,
                height: dropdownRect?.maxHeight ?? 220,
                overflow: "hidden",
                zIndex: 5000,
              }}
            >
              <div className="ts-dropdown__header">
                <FiSearch />
                <input
                  value={wtFilter[line.id] || ""}
                  onChange={(e) =>
                    setWtFilter((prev) => ({ ...prev, [line.id]: e.target.value }))
                  }
                  placeholder="Buscar servicio..."
                  style={{ width: "100%", border: "none", outline: "none" }}
                />
              </div>
              <div
                style={{
                  maxHeight: Math.max(40, (dropdownRect?.maxHeight ?? 220) - 40),
                  overflowY: "auto",
                }}
              >
                {(workTypesLoaded ? workTypes.filter((wt) =>
                  (wtFilter[line.id] || "").trim()
                    ? wt.toLowerCase().includes((wtFilter[line.id] || "").toLowerCase())
                    : true
                ) : []).map((wt) => (
                  <div
                    key={wt}
                    className="ts-dropdown__item"
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

                {workTypesLoaded && workTypes.length === 0 && (
                  <div style={{ padding: "8px", color: "#999" }}>Sin resultados…</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="ts-cell ts-readonly">{line.work_type || ""}</div>
      )}
    </td>
  );
}


