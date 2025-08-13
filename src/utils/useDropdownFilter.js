import { useState, useCallback } from "react";

// Hook genérico para gestionar filtro por línea y dropdown abierto
export default function useDropdownFilter() {
  const [filterByLine, setFilterByLine] = useState({}); // { [lineId]: string }
  const [openFor, setOpenFor] = useState(null); // lineId | null

  const getVisible = useCallback((lineId, items, toText) => {
    const list = Array.isArray(items) ? items : [];
    const q = (filterByLine[lineId] || "").toLowerCase();
    if (!q) return list;
    return list.filter((it) => (toText?.(it) || String(it)).toLowerCase().includes(q));
  }, [filterByLine]);

  return {
    filterByLine,
    setFilterByLine,
    openFor,
    setOpenFor,
    getVisible,
  };
}


