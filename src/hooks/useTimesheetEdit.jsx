import { useRef, useState, useEffect } from "react";
import TIMESHEET_FIELDS from "../constants/timesheetFields";
import { parse, isBefore, isAfter, format } from "date-fns";
import { formatDate, parseDate } from "../utils/dateHelpers";

export default function useTimesheetEdit({
  header,
  lines,
  editFormData,       // necesario para F8/validaciones
  setEditFormData,
  setErrors,
  calendarHolidays,
  addEmptyLine,       // función sincrónica del padre: crea línea local y devuelve id
}) {
  const inputRefs = useRef({});
  const selectionRef = useRef({ lineId: null, field: null, start: 0, end: 0 });
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);
  const didInitialFocus = useRef(false); // <-- evita robar foco tras añadir líneas

  // -------- Foco inicial: solo una vez --------
  useEffect(() => {
    if (!didInitialFocus.current && lines.length > 0) {
      const firstLineId = lines[0].id;
      const firstField = TIMESHEET_FIELDS[0];
      const input = inputRefs.current?.[firstLineId]?.[firstField];
      if (input) {
        setTimeout(() => {
          input.focus();
          input.select();
        }, 0);
        didInitialFocus.current = true; // <-- no volver a enfocar en siguientes cambios
      }
    }
  }, [lines]);

  // -------- Atajos de fecha estilo BC (se expanden en blur) --------
  const expandBcDateShortcut = (raw) => {
    if (!raw) return "";

    const today = new Date();
    const curMM = String(today.getMonth() + 1).padStart(2, "0");
    const curYYYY = String(today.getFullYear());

    const onlyDigits = raw.replace(/[^\d]/g, "");
    const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);

    // Con separadores: d/m(/y)
    if (raw.includes("/")) {
      let [d, m, y] = [parts[0] || "", parts[1] || "", parts[2] || ""];
      if (d && !m && !y) { m = curMM; y = curYYYY; }
      else if (d && m && !y) { y = curYYYY; }

      if (d) d = String(parseInt(d, 10)).padStart(2, "0");
      if (m) m = String(parseInt(m, 10)).padStart(2, "0");
      if (y && y.length === 2) {
        const yy = parseInt(y, 10);
        y = yy <= 69 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
      } else if (!y) y = curYYYY;

      if (d && m && y.length === 4) return `${d}/${m}/${y}`;
      return raw;
    }

    // Solo dígitos: 1-2=d; 3=dmm; 4=ddmm; 6=ddmmyy
    if (/^\d+$/.test(onlyDigits)) {
      if (onlyDigits.length <= 2) {
        const d = String(parseInt(onlyDigits, 10)).padStart(2, "0");
        return `${d}/${curMM}/${curYYYY}`;
      }
      if (onlyDigits.length === 3) {
        const d = String(parseInt(onlyDigits.slice(0, 1), 10)).padStart(2, "0");
        const m = String(parseInt(onlyDigits.slice(1, 3), 10)).padStart(2, "0");
        return `${d}/${m}/${curYYYY}`;
      }
      if (onlyDigits.length === 4) {
        const d = String(parseInt(onlyDigits.slice(0, 2), 10)).padStart(2, "0");
        const m = String(parseInt(onlyDigits.slice(2, 4), 10)).padStart(2, "0");
        return `${d}/${m}/${curYYYY}`;
      }
      if (onlyDigits.length === 6) {
        const d = String(parseInt(onlyDigits.slice(0, 2), 10)).padStart(2, "0");
        const m = String(parseInt(onlyDigits.slice(2, 4), 10)).padStart(2, "0");
        const yy = parseInt(onlyDigits.slice(4, 6), 10);
        const y = yy <= 69 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        return `${d}/${m}/${y}`;
      }
    }

    return raw;
  };

  // -------- Editar genérico --------
  const handleInputChange = (lineId, e) => {
    const { name, value } = e.target;
    if (name === "date" && header) {
      // Para fecha: solo almacenamos lo que escribe; expandimos/validamos en blur
      setEditFormData((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], date: value },
      }));
      return;
    }
    selectionRef.current = {
      lineId,
      field: name,
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [name]: value },
    }));
  };

  const handleDateInputChange = (lineId, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], date: value },
    }));
  };

  // -------- Validación (sin revertir valor) + foco/selección --------
  const validateAndSetDate = (lineId, value) => {
    if (!header) return false;
    const fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
    const toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
    const newDate = parseDate(value);

    const focusBack = () => {
      setTimeout(() => {
        const input = inputRefs.current?.[lineId]?.["date"];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    };

    if (!newDate || isNaN(newDate.getTime())) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], date: `Fecha inválida` },
      }));
      focusBack();
      return false;
    }
    if (isBefore(newDate, fromDate) || isAfter(newDate, toDate)) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          date: `La fecha debe estar entre ${formatDate(fromDate)} y ${formatDate(toDate)}`,
        },
      }));
      focusBack();
      return false;
    }
    if (isHoliday(newDate)) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], date: `La fecha es un día festivo` },
      }));
      focusBack();
      return false;
    }

    // OK: limpiar error y recordar “último válido”
    setErrors((prev) => {
      if (prev[lineId]) {
        const next = { ...prev[lineId] };
        delete next.date;
        return { ...prev, [lineId]: next };
      }
      return prev;
    });
    // (si quieres usarlo más tarde) podrías guardar lastValidDateRef.current[lineId] = value;
    return true;
  };

  const handleDateInputBlur = (lineId, value) => {
    const expanded = expandBcDateShortcut(value);
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], date: expanded },
    }));
    validateAndSetDate(lineId, expanded); // si es inválida, solo foco+selección
  };

  const isHoliday = (date) => {
    if (!calendarHolidays || calendarHolidays.length === 0) return false;
    const dayISO = format(date, "yyyy-MM-dd");
    return calendarHolidays.some((h) => h.day === dayISO && h.holiday === true);
  };

  // -------- Focus/selección --------
  const handleInputFocus = (lineId, field, e) => {
    const sel = selectionRef.current;
    if (sel.lineId === lineId && sel.field === field) {
      setTimeout(() => e.target.setSelectionRange(sel.start, sel.end), 0);
    } else {
      e.target.select();
    }
  };

  // -------- Teclado: F8 + navegación + crear nueva línea cuando toca --------
  const handleKeyDown = (e, lineIndex, fieldIndex) => {
    const key = e.key;

    // F8: copiar desde la celda superior
    if (key === "F8") {
      if (lineIndex > 0 && lines[lineIndex] && lines[lineIndex - 1]) {
        const currentLineId = lines[lineIndex].id;
        const prevLineId = lines[lineIndex - 1].id;
        const field = TIMESHEET_FIELDS[fieldIndex];
        const valueAbove = editFormData?.[prevLineId]?.[field] ?? "";
        setEditFormData((prev) => ({
          ...prev,
          [currentLineId]: { ...prev[currentLineId], [field]: valueAbove },
        }));
        setTimeout(() => {
          const input = inputRefs.current?.[currentLineId]?.[field];
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        e.preventDefault();
      }
      return;
    }

    const isNav = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(key);
    if (!isNav) return;

    // Si estamos en "date", expandimos y validamos antes de movernos
    const field = TIMESHEET_FIELDS[fieldIndex];
    if (field === "date") {
      const currentLineId = lines[lineIndex]?.id;
      const raw = editFormData?.[currentLineId]?.date ?? "";
      const expanded = expandBcDateShortcut(raw);

      if (expanded !== raw) {
        setEditFormData((prev) => ({
          ...prev,
          [currentLineId]: { ...prev[currentLineId], date: expanded },
        }));
      }

      const ok = validateAndSetDate(currentLineId, expanded);
      if (!ok) {
        e.preventDefault();
        return; // no navegamos si no es válida
      }
    }

    e.preventDefault();

    let nextLineIndex = lineIndex;
    let nextFieldIndex = fieldIndex;

    if (key === "ArrowUp") {
      nextLineIndex = lineIndex > 0 ? lineIndex - 1 : lines.length - 1;
    } else if (key === "ArrowDown") {
      // si es la última fila, crear nueva y enfocar MISMA columna
      if (lineIndex === lines.length - 1 && typeof addEmptyLine === "function") {
        const newId = addEmptyLine();
        const colName = TIMESHEET_FIELDS[fieldIndex]; // misma columna
        setTimeout(() => {
          const input = inputRefs.current?.[newId]?.[colName];
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        return;
      } else {
        nextLineIndex = lineIndex + 1;
      }
    } else if (key === "ArrowLeft") {
      nextFieldIndex = fieldIndex > 0 ? fieldIndex - 1 : TIMESHEET_FIELDS.length - 1;
      if (nextFieldIndex === TIMESHEET_FIELDS.length - 1) {
        nextLineIndex = lineIndex > 0 ? lineIndex - 1 : lines.length - 1;
      }
    } else if (key === "ArrowRight" || key === "Tab" || key === "Enter") {
      nextFieldIndex = fieldIndex < TIMESHEET_FIELDS.length - 1 ? fieldIndex + 1 : 0;
      if (nextFieldIndex === 0) {
        // hemos envuelto a la primera columna → bajar de fila
        if (lineIndex === lines.length - 1 && typeof addEmptyLine === "function") {
          const newId = addEmptyLine();
          const firstCol = TIMESHEET_FIELDS[0]; // al tabular pasa a la primera columna
          setTimeout(() => {
            const input = inputRefs.current?.[newId]?.[firstCol];
            if (input) {
              input.focus();
              input.select();
            }
          }, 0);
          return;
        } else {
          nextLineIndex = lineIndex + 1;
        }
      }
    }

    const nextLineId = lines[nextLineIndex].id;
    const nextFieldName = TIMESHEET_FIELDS[nextFieldIndex];
    const nextInput = inputRefs.current?.[nextLineId]?.[nextFieldName];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
      selectionRef.current = { lineId: nextLineId, field: nextFieldName, start: 0, end: nextInput.value.length };
    }
  };

  return {
    inputRefs,
    calendarOpenFor,
    setCalendarOpenFor,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleInputFocus,
    handleKeyDown,
  };
}
