// src/components/TimesheetEdit.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import TimesheetLines from "./TimesheetLines";
import { format } from "date-fns";

// Helpers de fecha
const pad2 = (n) => String(n).padStart(2, "0");
const isValidDate = (d) => d instanceof Date && !isNaN(d);
const parseDDMMYYYY = (s) => {
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return null;
  }
  return d;
};
const parseMaybe = (value) => {
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (typeof value === "string") {
    // dd/MM/yyyy o variantes
    const d1 = parseDDMMYYYY(value.replace(/[.\-]/g, "/"));
    if (d1) return d1;
    // yyyy-MM-dd
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      return isValidDate(d) ? d : null;
    }
  }
  return null;
};
const toDDMMYYYY = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

export default function TimesheetEdit({
  header,
  lines = [],
  calendarHolidays = [],
}) {
  // Estado de edición por línea
  const [editFormData, setEditFormData] = useState({});
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({});
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);

  // Cargar líneas en el estado de edición al entrar o cambiar
  useEffect(() => {
    const m = {};
    for (const l of Array.isArray(lines) ? lines : []) {
      m[l.id] = {
        job_no: l.job_no ?? "",
        job_task_no: l.job_task_no ?? "",
        description: l.description ?? "",
        work_type: l.work_type ?? "",
        quantity: l.quantity ?? "",
        date: l.date ?? "", // se muestra como dd/MM/yyyy
        department_code: l.department_code ?? "",
      };
    }
    setEditFormData(m);
    setErrors({});
  }, [lines]);

  // ———————————— Handlers base (sin autoguardado) ————————————
  // Acepta e (evento) o shape {target:{name,value}}
  const handleInputChange = (lineId, eOrObj) => {
    const { name, value } =
      eOrObj?.target ? eOrObj.target : { name: eOrObj.name, value: eOrObj.value };

    setEditFormData((prev) => {
      const cur = prev[lineId] || {};
      const next = { ...cur, [name]: value };

      // Mantener campo compuesto si lo usas en la UI
      const j = name === "job_no" ? value : cur.job_no || "";
      const d = name === "description" ? value : cur.description || "";
      next.job_no_and_description = j && d ? `${j} - ${d}` : (j || d || "");

      return { ...prev, [lineId]: next };
    });
  };

  // Acepta evento, string o Date
  const handleDateInputChange = (lineId, valueOrEventOrDate) => {
    let raw =
      valueOrEventOrDate instanceof Date
        ? valueOrEventOrDate
        : valueOrEventOrDate?.target
        ? valueOrEventOrDate.target.value
        : valueOrEventOrDate;

    let display = "";
    const parsed = parseMaybe(raw);
    if (parsed) {
      display = toDDMMYYYY(parsed);
    } else if (typeof raw === "string") {
      // dejar lo que escribió el usuario para no “pelear” mientras tipea
      display = raw;
    }

    setEditFormData((prev) => {
      const cur = prev[lineId] || {};
      return { ...prev, [lineId]: { ...cur, date: display } };
    });
  };

  // Normaliza y marca error si toca (NO guarda)
  const handleDateInputBlur = (lineId) => {
    setEditFormData((prev) => {
      const cur = prev[lineId] || {};
      const parsed = parseMaybe(cur.date);
      const nextDate = parsed ? toDDMMYYYY(parsed) : cur.date;
      return { ...prev, [lineId]: { ...cur, date: nextDate } };
    });
    setErrors((prev) => {
      const cur = editFormData[lineId];
      const parsed = parseMaybe(cur?.date);
      const msg = cur?.date && !parsed ? "Fecha inválida (usa dd/MM/yyyy)" : null;
      return { ...prev, [lineId]: { ...(prev[lineId] || {}), date: msg } };
    });
  };

  // Foco (por si necesitas algo más; ahora no-op)
  const handleInputFocus = () => {};

  // Navegación y F8 (copiar de arriba)
  const fieldOrder = useMemo(() => ([
    "job_no",
    "job_task_no",
    "description",
    "work_type",
    "quantity",
    "date",
    "department_code",
  ]), []);
  const indexOfField = (f) => fieldOrder.indexOf(f);

  const focusCell = (rowIdx, colIdx) => {
    const row = (lines || [])[rowIdx];
    const field = fieldOrder[colIdx];
    const el = inputRefs.current?.[row?.id]?.[field];
    if (el) {
      el.focus();
      if (el.select) el.select();
    }
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    // F8: copiar desde celda de arriba
    if (e.key === "F8") {
      const fromRow = (lines || [])[rowIdx - 1];
      const toRow = (lines || [])[rowIdx];
      const field = fieldOrder[colIdx];
      if (fromRow && toRow) {
        const fromVal = editFormData[fromRow.id]?.[field] ?? "";
        handleInputChange(toRow.id, { target: { name: field, value: fromVal } });
      }
      e.preventDefault();
      return;
    }

    // Flechas / Enter / Tab navegación simple
    if (e.key === "ArrowDown") {
      focusCell(Math.min(rowIdx + 1, (lines.length - 1)), colIdx);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      focusCell(Math.max(rowIdx - 1, 0), colIdx);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "Enter") {
      focusCell(rowIdx, Math.min(colIdx + 1, fieldOrder.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      focusCell(rowIdx, Math.max(colIdx - 1, 0));
      e.preventDefault();
    }
  };

  // ———————————— Render ————————————
  return (
    <div style={{ width: "100%" }}>
      <TimesheetLines
        lines={lines}
        header={header}
        calendarHolidays={calendarHolidays}
        editFormData={editFormData}
        errors={errors}
        inputRefs={inputRefs}
        calendarOpenFor={calendarOpenFor}
        setCalendarOpenFor={setCalendarOpenFor}
        handleInputChange={handleInputChange}
        handleDateInputChange={handleDateInputChange}
        handleDateInputBlur={handleDateInputBlur}
        handleInputFocus={handleInputFocus}
        handleKeyDown={handleKeyDown}
      />
    </div>
  );
}
