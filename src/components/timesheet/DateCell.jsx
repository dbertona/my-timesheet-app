import React, { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import { parse, format } from "date-fns";
import { parseDate, formatDate } from "../../utils/dateHelpers";
import TIMESHEET_FIELDS from "../../constants/timesheetFields";
import "../../styles/DateInput.css";

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
  calendarHolidays,
  disabled = false,
  align = "inherit", // 🆕 Prop para alineación
  handleInputFocus,
  handleKeyDown,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(parseDate(editFormData[line.id]?.date) || new Date());
  const [currentMonth, setCurrentMonth] = useState(parseDate(editFormData[line.id]?.date) || new Date());
  const calendarRef = useRef(null);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    };

    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarOpen]);

  // Re-renderizar cuando cambie el período para actualizar validación
  useEffect(() => {
    const effectivePeriod = header?.allocation_period || editableHeader?.allocation_period;

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
  }, [header?.allocation_period, editableHeader?.allocation_period]);

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

  // Verificar si una fecha está en el rango permitido
  const isInRange = (date) => {
    if (!header) return true;
    const fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
    const toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
    return date >= fromDate && date <= toDate;
  };

  // Cambiar mes del calendario
  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  // Seleccionar fecha
  const handleDateSelect = (date) => {
    const formattedDate = formatDate(date);
    handleInputChange(line.id, { target: { name: 'date', value: formattedDate } });
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  // Verificar si se puede navegar hacia atrás
  const canGoBack = () => {
    if (!header) return true;
    const fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
    const fromMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    return currentMonth > fromMonth;
  };

  // Verificar si se puede navegar hacia adelante
  const canGoForward = () => {
    if (!header) return true;
    const toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
    const toMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    return currentMonth < toMonth;
  };

  const days = generateDays();
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <td className="ts-td ts-cell" style={{ textAlign: align }}>
      <div className="ts-cell">
        <div className="ts-cell">
          <input
            type="text"
            name="date"
            value={editFormData[line.id]?.date || ""}
            onChange={(e) => !disabled && handleInputChange(line.id, { target: { name: 'date', value: e.target.value } })}
            onBlur={(e) => !disabled && handleInputChange(line.id, { target: { name: 'date', value: e.target.value } })}
            onFocus={(e) => !disabled && handleInputFocus && handleInputFocus(line.id, "date", e)}
            onKeyDown={(e) => !disabled && handleKeyDown && handleKeyDown(e, lineIndex, TIMESHEET_FIELDS.indexOf("date"))}
            ref={hasRefs ? (el) => setSafeRef(line.id, "date", el) : null}
            className={`ts-input pr-icon ${disabled ? 'ts-input-factorial' : ''}`}
            autoComplete="off"
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
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
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
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isHolidayDate = isHoliday(date);
                    const inRange = isInRange(date);

                    return (
                      <button
                        key={index}
                        type="button"
                        className={`ts-calendar-day ${
                          !isCurrentMonth ? 'ts-calendar-day--outside' : ''
                        } ${
                          isSelected ? 'ts-calendar-day--selected' : ''
                        } ${
                          isToday ? 'ts-calendar-day--today' : ''
                        } ${
                          isHolidayDate ? 'ts-calendar-day--holiday' : ''
                        } ${
                          !inRange ? 'ts-calendar-day--disabled' : ''
                        }`}
                        onClick={() => inRange && handleDateSelect(date)}
                        disabled={!inRange}
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
