import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Hook para redimensionar columnas y persistir en localStorage.
 * @param {string[]} columns - claves/ids de columna en orden.
 * @param {string} storageKey - clave de localStorage.
 * @param {number} minWidth - ancho mínimo en px.
 */
export default function useColumnResize(
  columns,
  storageKey,
  minWidth = 80,
  options = {}
) {
  const {
    perColumnMin = {},
    perColumnMax = {},
    getContainerWidth = null,
    initialWidths = {},
    disableResizeFor = [],
  } = options;
  const [widths, setWidths] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const base = {};
      columns.forEach((c) => {
        const fallback = initialWidths[c] ?? 160;
        base[c] = saved[c] ?? fallback;
      });
      return base;
    } catch {
      const base = {};
      columns.forEach((c) => {
        base[c] = initialWidths[c] ?? 160;
      });
      return base;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widths));
  }, [widths, storageKey]);

  const drag = useRef({ colKey: null, startX: 0, startWidth: 0 });

  const onMouseDown = (e, colKey) => {
    e.preventDefault();
    if (disableResizeFor?.includes?.(colKey)) return;
    drag.current = {
      colKey,
      startX: e.clientX,
      startWidth: widths[colKey] ?? 160,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    const { colKey, startX, startWidth } = drag.current;
    if (!colKey) return;
    const delta = e.clientX - startX;
    setWidths((prev) => {
      const current = prev[colKey] ?? startWidth;
      const raw = startWidth + delta;

      const min = Math.max(minWidth, perColumnMin[colKey] ?? minWidth);
      const max = perColumnMax[colKey] ?? Infinity;
      let next = Math.max(min, Math.min(max, raw));

      // Clamp por ancho de contenedor (evitar desbordes)
      if (getContainerWidth) {
        const containerW = Number(getContainerWidth()) || 0;
        if (containerW > 0) {
          const sumOther = columns
            .filter((k) => k !== colKey)
            .reduce((acc, k) => acc + (prev[k] ?? (initialWidths[k] ?? 160)), 0);
          const maxForThis = Math.max(min, Math.min(max, containerW - sumOther));
          next = Math.min(next, maxForThis);
        }
      }

      // Evitar trabajo innecesario si no cambia
      if (Math.round(next) === Math.round(current)) return prev;
      return { ...prev, [colKey]: next };
    });
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
