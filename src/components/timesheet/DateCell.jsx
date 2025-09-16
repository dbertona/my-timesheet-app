import { parse } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";
import "../../styles/DateInput.css";
import { formatDate, parseDate } from "../../utils/dateHelpers";

export default function DateCell({
  line,
  lineIndex,
  editFormData,
  handleInputChange,
  hasRefs,
  setSafeRef,
  error,
  header,
  editableHeader,
  serverDate,
  calendarHolidays,
  disabled = false,
  align = "inherit", // 🆕 Prop para alineación
  handleInputFocus,
  handleKeyDown,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const baseToday = serverDate || new Date();
  const [selectedDate, setSelectedDate] = useState(
    parseDate(editFormData[line.id]?.date) || baseToday
  );
  const [currentMonth, setCurrentMonth] = useState(
    parseDate(editFormData[line.id]?.date) || baseToday
  );
  const calendarRef = useRef(null);

  // Si llega serverDate y no hay fecha en la línea, ajustar selección/mes
  useEffect(() => {
    const hasDate = Boolean(editFormData[line.id]?.date);
    if (serverDate && !hasDate) {
      setSelectedDate(serverDate);
      setCurrentMonth(serverDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverDate, line.id]);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    };

    if (calendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarOpen]);

  // Re-renderizar cuando cambie el período para actualizar validación
  const effectivePeriod = useMemo(() => {
    return header?.allocation_period || editableHeader?.allocation_period;
  }, [header?.allocation_period, editableHeader?.allocation_period]);

  useEffect(() => {
    if (effectivePeriod) {
      const period = effectivePeriod;
      const match = period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const newMonth = new Date(year, month, 1);
        setCurrentMonth(newMonth);
      }
    }
  }, [effectivePeriod]);

  // Generar días del mes
  const generateDays = () => {
    let targetMonth = currentMonth;

    if (!header && editableHeader?.allocation_period) {
      const period = editableHeader.allocation_period;
      const match = period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        targetMonth = new Date(year, month, 1);
      }
    }

    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Lunes

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Verificar si una fecha es feriado (robusto, igual a DateInput)
  const isHoliday = (date) => {
    if (!calendarHolidays || calendarHolidays.length === 0) return false;

    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    const dateDay = date.getDate();

    return calendarHolidays.some((h) => {
      let holidayDate = null;

      // Soportar múltiples formatos: { day: string|Date, holiday: bool } o { date: string }
      if (h && typeof h === "object") {
        if (h.day instanceof Date) {
          holidayDate = h.day;
        } else if (typeof h.day === "string") {
          holidayDate = new Date(h.day);
        } else if (typeof h.date === "string") {
          holidayDate = new Date(h.date);
        }
      } else if (typeof h === "string") {
        holidayDate = new Date(h);
      }

      if (!holidayDate || isNaN(holidayDate.getTime())) return false;

      const matches =
        holidayDate.getFullYear() === dateYear &&
        holidayDate.getMonth() === dateMonth &&
        holidayDate.getDate() === dateDay;

      // Si existe bandera holiday, respétala; si no, considerar el match como feriado
      return matches && (h.holiday === undefined || h.holiday === true);
    });
  };

  // Helper robusto: aceptar fechas del header como string o Date
  const _parseHeaderDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "string") {
      // Intentar diferentes formatos de fecha que pueden venir de la BD
      const formats = [
        "yyyy-MM-dd", // 2024-01-15
        "dd/MM/yyyy", // 15/01/2024
        "yyyy-MM-dd'T'HH:mm:ss", // 2024-01-15T10:30:00
        "yyyy-MM-dd'T'HH:mm:ss.SSS", // 2024-01-15T10:30:00.000
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // 2024-01-15T10:30:00.000Z
        "yyyy-MM-dd'T'HH:mm:ss'Z'", // 2024-01-15T10:30:00Z
      ];

      for (const format of formats) {
        try {
          const parsed = parse(val, format, new Date());
          if (!isNaN(parsed.getTime())) return parsed;
        } catch {
          // Continuar con el siguiente formato
        }
      }

      // Último intento con Date constructor
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Verificar si una fecha está en el rango permitido
  const isInRange = (date) => {
    // Usar allocation_period tanto para edición como inserción (unificado)
    const period =
      header?.allocation_period || editableHeader?.allocation_period;

    if (period) {
      const match = period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0); // Último día del mes
        return date >= firstDay && date <= lastDay;
      }
    }

    // Fallback: permitir cualquier fecha
    return true;
  };

  // Cambiar mes del calendario
  const changeMonth = (delta) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  // Seleccionar fecha
  const handleDateSelect = (date) => {
    const formattedDate = formatDate(date);
    handleInputChange(line.id, {
      target: { name: "date", value: formattedDate },
    });
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  // Verificar si se puede navegar hacia atrás
  const canGoBack = () => {
    // Usar allocation_period tanto para edición como inserción (unificado)
    const period =
      header?.allocation_period || editableHeader?.allocation_period;

    if (period) {
      const match = period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const periodMonth = new Date(year, month, 1);
        return currentMonth > periodMonth;
      }
    }

    return true;
  };

  // Verificar si se puede navegar hacia adelante
  const canGoForward = () => {
    // Usar allocation_period tanto para edición como inserción (unificado)
    const period =
      header?.allocation_period || editableHeader?.allocation_period;

    if (period) {
      const match = period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const periodMonth = new Date(year, month, 1);
        return currentMonth < periodMonth;
      }
    }

    return true;
  };

  const days = generateDays();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // ==========================
  // Normalización de entrada
  // ==========================
  const getEffectiveMonthYear = () => {
    // 1) Si hay header (edición), usar el mes de from_date
    if (header?.from_date) {
      const d = parse(header.from_date, "yyyy-MM-dd", new Date());
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    // 2) Si hay editableHeader (inserción), usar allocation_period
    if (editableHeader?.allocation_period) {
      const match = editableHeader.allocation_period.match(/M(\d{2})-M(\d{2})/);
      if (match) {
        const year = 2000 + parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        return { year, month };
      }
    }
    // 3) Fallback: usar mes del calendario actual
    return { year: currentMonth.getFullYear(), month: currentMonth.getMonth() };
  };

  const normalizeDisplayDate = (raw) => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    // Solo día → completar con mes/año efectivos
    if (/^\d{1,2}$/.test(trimmed)) {
      const { year, month } = getEffectiveMonthYear();
      let day = Math.max(1, Math.min(31, parseInt(trimmed, 10)));
      const lastDay = new Date(year, month + 1, 0).getDate();
      if (day > lastDay) day = lastDay;
      const d = new Date(year, month, day);
      return formatDate(d);
    }
    // dd/MM o dd/M → completar año
    if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
      const [dd, mm] = trimmed.split("/");
      const { year } = getEffectiveMonthYear();
      const d = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10));
      return formatDate(d);
    }
    // Si ya viene dd/MM/yyyy, devolver tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    return null;
  };

  return (
    <td className="ts-td ts-cell" style={{ textAlign: align }}>
      <div className="ts-cell">
        <div className="ts-cell">
          <input
            type="text"
            name="date"
            value={editFormData[line.id]?.date || ""}
            onChange={(e) =>
              !disabled &&
              handleInputChange(line.id, {
                target: { name: "date", value: e.target.value },
              })
            }
            onBlur={(e) => {
              if (disabled) return;
              const currentValue = e.target.value;
              const normalized =
                normalizeDisplayDate(currentValue) || currentValue;
              handleInputChange(line.id, {
                target: { name: "date", value: normalized },
              });
            }}
            onFocus={(e) =>
              !disabled &&
              handleInputFocus &&
              handleInputFocus(line.id, "date", e)
            }
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Enter" || e.key === "Tab") {
                const normalized = normalizeDisplayDate(e.currentTarget.value);
                if (normalized) {
                  e.preventDefault();
                  handleInputChange(line.id, {
                    target: { name: "date", value: normalized },
                  });
                }
              }
              handleKeyDown &&
                handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("date"));
            }}
            ref={hasRefs ? (el) => setSafeRef(line.id, "date", el) : null}
            className={`ts-input pr-icon ${disabled ? "ts-input-factorial" : ""}`}
            autoComplete="off"
            placeholder={serverDate ? formatDate(serverDate) : ""}
            disabled={disabled}
            style={{
              textAlign: "inherit !important", // 🆕 Heredar alineación del padre con !important
            }}
          />
          <FiCalendar
            onClick={() => !disabled && setCalendarOpen(!calendarOpen)}
            className="ts-icon ts-icon--calendar"
            tabIndex={-1}
            aria-label="Abrir calendario"
            style={{
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          />

          {calendarOpen && !disabled && (
            <div className="ts-datepop" ref={calendarRef}>
              <div className="ts-calendar">
                {/* Header del calendario */}
                <div className="ts-calendar-header">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="ts-calendar-nav"
                    disabled={!canGoBack()}
                  >
                    ‹
                  </button>
                  <span className="ts-calendar-month">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="ts-calendar-nav"
                    disabled={!canGoForward()}
                  >
                    ›
                  </button>
                </div>

                {/* Días de la semana */}
                <div className="ts-calendar-weekdays">
                  <div>Lu</div>
                  <div>Ma</div>
                  <div>Mi</div>
                  <div>Ju</div>
                  <div>Vi</div>
                  <div>Sá</div>
                  <div>Do</div>
                </div>

                {/* Días del mes */}
                <div className="ts-calendar-days">
                  {days.map((date, index) => {
                    const isCurrentMonth =
                      date.getMonth() === currentMonth.getMonth();
                    const isSelected =
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString();
                    const isToday =
                      date.toDateString() === baseToday.toDateString();
                    const isHolidayDate = isHoliday(date);
                    const inRange = isInRange(date);
                    const canSelect = inRange && !isHolidayDate;

                    return (
                      <button
                        key={index}
                        type="button"
                        className={`ts-calendar-day ${
                          !isCurrentMonth ? "ts-calendar-day--outside" : ""
                        } ${isSelected ? "ts-calendar-day--selected" : ""} ${
                          isToday ? "ts-calendar-day--today" : ""
                        } ${isHolidayDate ? "ts-calendar-day--holiday" : ""} ${
                          !canSelect ? "ts-calendar-day--disabled" : ""
                        }`}
                        onClick={() => canSelect && handleDateSelect(date)}
                        disabled={!canSelect}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div style={{ position: "static", marginTop: 4 }}>
          <span className="ts-inline-error" role="alert" aria-live="polite">
            <span className="ts-inline-error__dot" />
            {error}
          </span>
        </div>
      )}
    </td>
  );
}
