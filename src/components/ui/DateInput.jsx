import React, { useState, useRef, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";
import { parse, format } from "date-fns";
import { parseDate, formatDate } from "../../utils/dateHelpers";
import "../../styles/DateInput.css";

export default function DateInput({
  name = "date",
  value,
  onChange,      // (newDisplayValue)
  onBlur,        // (finalDisplayValue)
  onFocus,
  onKeyDown,
  inputRef,
  error,
  calendarOpen,
  setCalendarOpen,
  header,
  editableHeader, // 🆕 Recibir editableHeader para validación en inserción
  calendarHolidays,
  className,
  inputId,
  disabled = false, // 🆕 Prop para deshabilitar el input
}) {
  const [selectedDate, setSelectedDate] = useState(parseDate(value) || new Date());
  const [currentMonth, setCurrentMonth] = useState(parseDate(value) || new Date());
  const calendarRef = useRef(null);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen?.(false);
      }
    };

    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarOpen, setCalendarOpen]);

    // 🆕 Re-renderizar cuando cambie el período para actualizar validación
  useEffect(() => {


    // ✅ Usar header.allocation_period en lugar de editableHeader.allocation_period
    const effectivePeriod = header?.allocation_period || editableHeader?.allocation_period;

    if (effectivePeriod) {
      // ✅ Cuando cambie el período, centrar el calendario en ese mes
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
    // ✅ Para inserción: usar el período del editableHeader si no hay header
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

  // Navegar mes
  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);

      // ✅ Verificar si el nuevo mes está dentro del rango (header o editableHeader)
      const effectiveHeader = header || editableHeader;
      if (effectiveHeader) {
        let fromDate, toDate;

        if (header?.from_date && header?.to_date) {
          // ✅ Para edición: usar fechas existentes
          fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
          toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
        } else if (editableHeader?.allocation_period) {
          // ✅ Para inserción: calcular fechas del período
          const period = editableHeader.allocation_period;
          const match = period.match(/M(\d{2})-M(\d{2})/);
          if (match) {
            const year = 2000 + parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            fromDate = new Date(year, month, 1);
            toDate = new Date(year, month + 1, 0);
          }
        }

        if (fromDate && toDate) {
          // Si vamos hacia atrás, verificar que no sea antes del mes de from_date
          if (direction < 0) {
            const fromMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
            if (newMonth < fromMonth) {
              return prev; // No cambiar si está fuera del rango
            }
          }

          // Si vamos hacia adelante, verificar que no sea después del mes de to_date
          if (direction > 0) {
            const toMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
            if (newMonth > toMonth) {
              return prev; // No cambiar si está fuera del rango
            }
          }
        }
      }

      return newMonth;
    });
  };

  // Seleccionar fecha
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const formatted = formatDate(date);
    onChange?.(formatted);
    onBlur?.(formatted);
    setCalendarOpen?.(false);
  };

  // Verificar si es festivo
  const isHoliday = (date) => {
    if (!calendarHolidays || calendarHolidays.length === 0) return false;

    // Comparar fechas por componentes para evitar problemas de zona horaria
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();
    const dateDay = date.getDate();

    return calendarHolidays.some((h) => {
      let holidayDate;

      if (typeof h.day === "string") {
        // Si es string, crear Date
        holidayDate = new Date(h.day);
      } else {
        // Si ya es Date, usar directamente
        holidayDate = h.day;
      }

      // Comparar año, mes y día individualmente
      return holidayDate.getFullYear() === dateYear &&
             holidayDate.getMonth() === dateMonth &&
             holidayDate.getDate() === dateDay &&
             h.holiday === true;
    });
  };

  // Verificar si está en rango
  const isInRange = (date) => {
    if (!header) return true;
    const fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
    const toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
    return date >= fromDate && date <= toDate;
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
    <div className="ts-cell" style={{ width: "100%", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={(e) => !disabled && onChange?.(e.target.value)}
        onBlur={(e) => !disabled && onBlur?.(e.target.value)}
        onFocus={!disabled ? onFocus : undefined}
        onKeyDown={!disabled ? onKeyDown : undefined}
        ref={inputRef}
        className={className}
        autoComplete="off"
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        disabled={disabled}
        style={{
          textAlign: "inherit !important", // 🆕 Heredar alineación del padre con !important
        }}
      />
      <FiCalendar
        onClick={() => setCalendarOpen?.(!calendarOpen)}
        className="ts-icon ts-icon--calendar"
        tabIndex={-1}
        aria-label="Abrir calendario"
      />

      {calendarOpen && (
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
  );
}


