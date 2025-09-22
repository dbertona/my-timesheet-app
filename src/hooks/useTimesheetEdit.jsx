import { format, isAfter, isBefore, parse } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import TIMESHEET_FIELDS from "../constants/timesheetFields";
import { formatDate, parseDate } from "../utils/dateHelpers";

export default function useTimesheetEdit({
  header,
  lines,
  editFormData, // necesario para F8/validaciones
  setEditFormData,
  setErrors,
  calendarHolidays,
  addEmptyLine, // función sincrónica del padre: crea línea local y devuelve id
  markAsChanged, // función para marcar cambios no guardados
  readOnly = false,
}) {
  const inputRefs = useRef({});
  const selectionRef = useRef({ lineId: null, field: null, start: 0, end: 0 });
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);
  const didInitialFocus = useRef(false); // <-- evita robar foco tras añadir líneas

  // Función para registrar referencias a inputs
  const setSafeRef = useCallback((lineId, fieldName, element) => {
    if (element && lineId && fieldName) {
      if (!inputRefs.current[lineId]) {
        inputRefs.current[lineId] = {};
      }
      inputRefs.current[lineId][fieldName] = element;
    }
  }, []);

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
    const parts = raw
      .split("/")
      .map((p) => p.trim())
      .filter(Boolean);

    // Con separadores: d/m(/y)
    if (raw.includes("/")) {
      let [d, m, y] = [parts[0] || "", parts[1] || "", parts[2] || ""];
      if (d && !m && !y) {
        m = curMM;
        y = curYYYY;
      } else if (d && m && !y) {
        y = curYYYY;
      }

      if (d) d = String(parseInt(d, 10)).padStart(2, "0");
      if (m) m = String(parseInt(m, 10)).padStart(2, "0");
      if (y && y.length === 2) {
        const yy = parseInt(y, 10);
        y =
          yy <= 69
            ? `20${String(yy).padStart(2, "0")}`
            : `19${String(yy).padStart(2, "0")}`;
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
        const y =
          yy <= 69
            ? `20${String(yy).padStart(2, "0")}`
            : `19${String(yy).padStart(2, "0")}`;
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
    // Registrar foco actual para que F8 global y la navegación sepan dónde estamos
    const start = e?.target?.selectionStart ?? 0;
    const end = e?.target?.selectionEnd ?? e?.target?.value?.length ?? 0;
    selectionRef.current = { lineId, field, start, end };
    const sel = selectionRef.current;
    if (sel.lineId === lineId && sel.field === field) {
      setTimeout(() => {
        try {
          e.target.setSelectionRange(sel.start, sel.end);
        } catch {
          /* ignore */
        }
      }, 0);
    } else {
      try {
        e.target.select();
      } catch {
        /* ignore */
      }
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

        console.log("🔍 F8 DEBUG:", {
          lineIndex,
          fieldIndex,
          field,
          currentLineId,
          prevLineId,
          valueAbove,
          currentValue: editFormData?.[currentLineId]?.[field],
        });

        // 🆕 Validación especial para tareas: permitir copia en más casos
        if (field === "job_task_no") {
          const currentJobNo = editFormData?.[currentLineId]?.job_no;
          const prevJobNo = editFormData?.[prevLineId]?.job_no;

          console.log("🔍 F8 TASK DEBUG:", {
            currentJobNo,
            prevJobNo,
            valueAbove,
            currentLineId,
            prevLineId,
            currentLineData: editFormData?.[currentLineId],
            prevLineData: editFormData?.[prevLineId],
          });

          // 🆕 Lógica más permisiva: solo bloquear si hay una tarea específica que no es genérica
          // Permitir copiar tareas genéricas como "GASTO", "HORAS", etc. independientemente del proyecto
          const genericTasks = [
            "GASTO",
            "HORAS",
            "VIAJE",
            "REUNION",
            "ADMIN",
            "OTROS",
          ];
          const isGenericTask = genericTasks.some((task) =>
            valueAbove?.toUpperCase().includes(task.toUpperCase())
          );

          // Solo bloquear si NO es una tarea genérica Y los proyectos son diferentes
          if (
            currentJobNo &&
            prevJobNo &&
            currentJobNo !== prevJobNo &&
            !isGenericTask
          ) {
            console.log(
              "🚫 F8: No copiar tarea - proyectos diferentes y tarea no genérica",
              {
                currentJobNo,
                prevJobNo,
                valueAbove,
                isGenericTask,
              }
            );
            e.preventDefault();
            return;
          }

          // Si es una tarea genérica, permitir la copia
          if (isGenericTask) {
            console.log("✅ F8: Copiando tarea genérica", {
              valueAbove,
              isGenericTask,
            });
          }
        }

        setEditFormData((prev) => ({
          ...prev,
          [currentLineId]: { ...prev[currentLineId], [field]: valueAbove },
        }));

        // Marcar como cambiado
        if (typeof markAsChanged === "function") {
          markAsChanged();
        }

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

    const isNav = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
    ].includes(key);
    if (!isNav) return;

    // Dirección de navegación explícita (soporte Shift+Tab como retroceso)
    const isBackward = key === "ArrowLeft" || (key === "Tab" && e.shiftKey);
    const isForward =
      key === "ArrowRight" || key === "Enter" || (key === "Tab" && !e.shiftKey);

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
      if (
        !readOnly &&
        lineIndex === lines.length - 1 &&
        typeof addEmptyLine === "function"
      ) {
        const newId = addEmptyLine();
        const colName = TIMESHEET_FIELDS[fieldIndex]; // misma columna
        setTimeout(() => {
          const input = inputRefs.current?.[newId]?.[colName];
          input?.focus?.();
          input?.select?.();
        }, 0);
        return;
      } else {
        nextLineIndex = lineIndex + 1;
      }
    } else if (isBackward) {
      nextFieldIndex =
        fieldIndex > 0 ? fieldIndex - 1 : TIMESHEET_FIELDS.length - 1;
      if (nextFieldIndex === TIMESHEET_FIELDS.length - 1) {
        nextLineIndex = lineIndex > 0 ? lineIndex - 1 : lines.length - 1;
      }
    } else if (isForward) {
      nextFieldIndex =
        fieldIndex < TIMESHEET_FIELDS.length - 1 ? fieldIndex + 1 : 0;
      if (nextFieldIndex === 0) {
        // hemos envuelto a la primera columna → bajar de fila
        if (
          !readOnly &&
          lineIndex === lines.length - 1 &&
          typeof addEmptyLine === "function"
        ) {
          const newId = addEmptyLine();
          const firstCol = TIMESHEET_FIELDS[0]; // al tabular pasa a la primera columna
          setTimeout(() => {
            const input = inputRefs.current?.[newId]?.[firstCol];
            input?.focus?.();
            input?.select?.();
          }, 0);
          return;
        } else {
          nextLineIndex = lineIndex + 1;
        }
      }
    }

    // Función para identificar si una columna es editable
    const isColumnEditable = (colKey) => {
      // Columnas NO editables
      const nonEditableColumns = ["job_no_description", "department_code"];
      return !nonEditableColumns.includes(colKey);
    };

    // Función para identificar si una línea es editable en general
    const isRowEditable = (rowIndex) => {
      if (readOnly) return false;
      const ln = lines[rowIndex];
      if (!ln) return false;
      if (ln.isFactorialLine) return false;
      if (ln.status === "Pending") return false;
      return true;
    };

    // Si el siguiente campo no es editable, saltarlo
    let attempts = 0;
    const maxAttempts = TIMESHEET_FIELDS.length; // Evitar bucle infinito

    while (
      !isColumnEditable(TIMESHEET_FIELDS[nextFieldIndex]) &&
      attempts < maxAttempts
    ) {
      if (isBackward) {
        // Ir a la columna anterior
        nextFieldIndex =
          nextFieldIndex > 0 ? nextFieldIndex - 1 : TIMESHEET_FIELDS.length - 1;
        if (nextFieldIndex === TIMESHEET_FIELDS.length - 1) {
          nextLineIndex =
            nextLineIndex > 0 ? nextLineIndex - 1 : lines.length - 1;
        }
      } else if (isForward) {
        // Ir a la columna siguiente
        nextFieldIndex =
          nextFieldIndex < TIMESHEET_FIELDS.length - 1 ? nextFieldIndex + 1 : 0;
        if (nextFieldIndex === 0) {
          nextLineIndex =
            nextLineIndex < lines.length - 1 ? nextLineIndex + 1 : 0;
        }
      }
      attempts++;
    }

    // Si la fila objetivo no es editable, buscar la siguiente fila editable
    let rowAttempts = 0;
    const maxRowAttempts = Math.max(1, lines.length);
    while (!isRowEditable(nextLineIndex) && rowAttempts < maxRowAttempts) {
      if (key === "ArrowUp") {
        nextLineIndex = nextLineIndex > 0 ? nextLineIndex - 1 : lines.length - 1;
      } else {
        nextLineIndex = nextLineIndex < lines.length - 1 ? nextLineIndex + 1 : 0;
      }
      rowAttempts++;
    }

    // Garantizar que la columna elegida sea editable tras mover de fila
    attempts = 0;
    while (!isColumnEditable(TIMESHEET_FIELDS[nextFieldIndex]) && attempts < maxAttempts) {
      if (isBackward || key === "ArrowUp") {
        nextFieldIndex =
          nextFieldIndex > 0 ? nextFieldIndex - 1 : TIMESHEET_FIELDS.length - 1;
      } else {
        nextFieldIndex =
          nextFieldIndex < TIMESHEET_FIELDS.length - 1 ? nextFieldIndex + 1 : 0;
      }
      attempts++;
    }

    // Después de saltar columnas no editables: si estamos en última fila y
    // el movimiento por Enter/Tab/ArrowRight termina en la primera columna,
    // crear una nueva línea y enfocar `job_no` en esa nueva línea.
    if (
      !readOnly &&
      isForward &&
      lineIndex === lines.length - 1 &&
      nextFieldIndex === 0 &&
      typeof addEmptyLine === "function"
    ) {
      const newId = addEmptyLine();
      const firstCol = TIMESHEET_FIELDS[0];
      setTimeout(() => {
        const input = inputRefs.current?.[newId]?.[firstCol];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }

    const nextLineId = lines[nextLineIndex].id;
    const nextFieldName = TIMESHEET_FIELDS[nextFieldIndex];
    const nextInput = inputRefs.current?.[nextLineId]?.[nextFieldName];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
      selectionRef.current = {
        lineId: nextLineId,
        field: nextFieldName,
        start: 0,
        end: nextInput.value.length,
      };
    }
  };

  // Listener global para F8 por si algún input no reenvía onKeyDown
  useEffect(() => {
    const onGlobalKey = (e) => {
      if (e.key !== "F8") return;
      e.preventDefault();
      const current = selectionRef.current;
      if (!current?.lineId || !current?.field) return;
      const idx = lines.findIndex((l) => l.id === current.lineId);
      if (idx <= 0) return; // no hay fila superior
      const prevId = lines[idx - 1].id;
      const valueAbove = editFormData?.[prevId]?.[current.field] ?? "";
      setEditFormData((prev) => ({
        ...prev,
        [current.lineId]: {
          ...prev[current.lineId],
          [current.field]: valueAbove,
        },
      }));
      // marcar cambios
      if (typeof markAsChanged === "function") {
        markAsChanged();
      }
      // re-enfocar la celda activa si existe
      const input = inputRefs.current?.[current.lineId]?.[current.field];
      if (input)
        setTimeout(() => {
          try {
            input.focus();
            input.select();
          } catch {
            /* ignore */
          }
        }, 0);
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, [lines, editFormData, markAsChanged, setEditFormData]);

  return {
    inputRefs,
    setSafeRef,
    hasRefs: true,
    calendarOpenFor,
    setCalendarOpenFor,
    handleInputChange,
    handleDateInputChange,
    handleDateInputBlur,
    handleInputFocus,
    handleKeyDown,
  };
}
