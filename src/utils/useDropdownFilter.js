import { useState, useCallback, useRef, useEffect } from "react";

// Hook genérico para gestionar filtro por línea y dropdown abierto
export default function useDropdownFilter() {
  const [filterByLine, setFilterByLine] = useState({}); // { [lineId]: string }
  const [openFor, setOpenFor] = useState(null); // lineId | null
  const [activeIndex, setActiveIndex] = useState(-1); // índice del ítem activo
  const debounceTimerRef = useRef(null);

  // Debounce del filtro (100ms)
  const setFilterWithDebounce = useCallback((lineId, value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setFilterByLine((prev) => ({ ...prev, [lineId]: value }));
      setActiveIndex(-1); // resetear ítem activo al cambiar filtro
    }, 100);
  }, []);

  // Navegación con teclado
  const handleKeyNavigation = useCallback((key, items, currentIndex) => {
    if (!Array.isArray(items) || items.length === 0) return currentIndex;

    switch (key) {
      case "ArrowDown":
        return Math.min(currentIndex + 1, items.length - 1);
      case "ArrowUp":
        return Math.max(currentIndex - 1, 0);
      case "Home":
        return 0;
      case "End":
        return items.length - 1;
      case "PageUp":
        return Math.max(currentIndex - 10, 0);
      case "PageDown":
        return Math.min(currentIndex + 10, items.length - 1);
      default:
        return currentIndex;
    }
  }, []);

  // Cerrar dropdown con Escape
  const handleEscape = useCallback(() => {
    setOpenFor(null);
    setActiveIndex(-1);
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const getVisible = useCallback(
    (lineId, items, toText) => {
      const list = Array.isArray(items) ? items : [];
      const q = (filterByLine[lineId] || "").toLowerCase();
      if (!q) return list;
      return list.filter((it) =>
        (toText?.(it) || String(it)).toLowerCase().includes(q),
      );
    },
    [filterByLine],
  );

  return {
    filterByLine,
    setFilterByLine: setFilterWithDebounce,
    openFor,
    setOpenFor,
    activeIndex,
    setActiveIndex,
    getVisible,
    handleKeyNavigation,
    handleEscape,
  };
}
