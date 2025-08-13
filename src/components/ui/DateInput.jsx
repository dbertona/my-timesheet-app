import React, { Suspense } from "react";
const ReactDatePicker = React.lazy(() => import("react-datepicker"));
import { es } from "date-fns/locale";
import { FiCalendar } from "react-icons/fi";
import { parseDate, formatDate } from "../../utils/dateHelpers";
import { format } from "date-fns";

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
  calendarHolidays,
  className,
  inputId,
}) {
  return (
    <div className="ts-cell" style={{ width: "100%", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={(e) => onBlur?.(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        ref={inputRef}
        className={className}
        autoComplete="off"
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
      />
      <FiCalendar onClick={() => setCalendarOpen?.(true)} className="ts-icon ts-icon--calendar" tabIndex={-1} aria-label="Abrir calendario" />
      {calendarOpen && (
        <div className="ts-datepop">
          <Suspense fallback={<div style={{ padding: 8, color: "#999" }}>Cargando calendario…</div>}>
            <ReactDatePicker
              selected={parseDate(value)}
              onChange={(date) => {
                const formatted = formatDate(date);
                onChange?.(formatted);
                onBlur?.(formatted);
                setCalendarOpen?.(false);
              }}
              onClickOutside={() => setCalendarOpen?.(false)}
              dateFormat="dd/MM/yyyy"
              locale={es}
              minDate={header ? new Date(header.from_date) : null}
              maxDate={header ? new Date(header.to_date) : null}
              filterDate={(date) => {
                if (!calendarHolidays || calendarHolidays.length === 0) return true;
                const dayISO = format(date, "yyyy-MM-dd");
                return !calendarHolidays.some((h) => {
                  const d = typeof h.day === "string" ? h.day : format(new Date(h.day), "yyyy-MM-dd");
                  return d === dayISO && h.holiday === true;
                });
              }}
              inline
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}


