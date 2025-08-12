import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Hook para redimensionar columnas y persistir en localStorage.
 * @param {string[]} columns - claves/ids de columna en orden.
 * @param {string} storageKey - clave de localStorage.
 * @param {number} minWidth - ancho mínimo en px.
 */
export default function useColumnResize(columns, storageKey, minWidth = 80) {
  const [widths, setWidths] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const base = {};
      columns.forEach((c) => { base[c] = saved[c] ?? 160; });
      return base;
    } catch {
      const base = {};
      columns.forEach((c) => { base[c] = 160; });
      return base;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widths));
  }, [widths, storageKey]);

  const drag = useRef({ colKey: null, startX: 0, startWidth: 0 });

  const onMouseDown = (e, colKey) => {
    e.preventDefault();
    drag.current = { colKey, startX: e.clientX, startWidth: widths[colKey] ?? 160 };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    const { colKey, startX, startWidth } = drag.current;
    if (!colKey) return;
    const next = Math.max(minWidth, startWidth + (e.clientX - startX));
    setWidths((prev) => ({ ...prev, [colKey]: next }));
  };

  const onMouseUp = () => {
    drag.current = { colKey: null, startX: 0, startWidth: 0 };
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const colStyles = useMemo(() => {
    const out = {};
    columns.forEach((c) => {
      const w = widths[c];
      out[c] = { width: w, minWidth: w, maxWidth: w };
    });
    return out;
  }, [columns, widths]);

  return { colStyles, onMouseDown, widths, setWidths };
}
