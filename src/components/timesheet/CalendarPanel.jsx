import React, { useEffect, useRef } from "react";
import { CALENDAR, LABELS } from '../../constants/i18n';
import { FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function CalendarPanel({
  calRange,
  firstOffset,
  calendarDays,
  requiredSum,
  imputedSum,
  missingSum,
  rightPadState: _rightPadState,
  onDayClick,
}) {
  const calendarBoxRef = useRef(null);

  useEffect(() => {
    const updateCalendarHeight = () => {};
    updateCalendarHeight();
    return () => {};
  }, []);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 210, border: "1px solid #d9d9d9", borderRadius: 6, padding: 12, background: "var(--bc-teal)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8, textAlign: "center", color: "#ffffff", fontSize: 14 }}>
          Resumen mes
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label-wrapper">
              <FiClock className="summary-icon" />
              <span className="summary-label">{LABELS.REQUIRED_HOURS}:</span>
            </div>
            <span className="summary-value">{requiredSum.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <div className="summary-label-wrapper">
              <FiCheckCircle className="summary-icon" />
              <span className="summary-label">{LABELS.WORKED_HOURS}:</span>
            </div>
            <span className="summary-value">{imputedSum.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <div className="summary-label-wrapper">
              <FiAlertCircle className="summary-icon" />
              <span className="summary-label">{LABELS.REMAINING_HOURS}:</span>
            </div>
            <span className="summary-value">{missingSum.toFixed(2)}</span>
          </div>

          {/* Barra de progreso visual */}
          {requiredSum > 0 && (
            <div className="summary-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min((imputedSum / requiredSum) * 100, 100)}%`,
                    backgroundColor: imputedSum >= requiredSum ? '#4ade80' : '#fbbf24'
                  }}
                ></div>
              </div>
              <div className="progress-text">
                {Math.round((imputedSum / requiredSum) * 100)}% completado
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={calendarBoxRef} style={{ width: 210, border: "1px solid #d9d9d9", borderRadius: 6, padding: 12, background: "#fff" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {calRange.month ? `${String(calRange.month).padStart(2, "0")}/${calRange.year}` : "Mes"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 12, color: "#666", marginBottom: 6 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} style={{ textAlign: "center" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: firstOffset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {calendarDays.map((day) => {
            let backgroundColor;
            switch (day.status) {
              case "sin-horas":
                backgroundColor = "lightgray";
                break;
              case "cero":
                backgroundColor = "red";
                break;
              case "parcial":
                backgroundColor = "yellow";
                break;
              case "completo":
                backgroundColor = "lightgreen";
                break;
              default:
                backgroundColor = undefined;
            }
            return (
              <div
                key={day.iso}
                style={{ textAlign: "center", cursor: "pointer" }}
                title={`${day.iso} • Req: ${day.need} • Imp: ${day.got}`}
                onClick={() => { if (typeof onDayClick === 'function') onDayClick(day.iso); }}
              >
                <div
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "3px 0",
                    borderRadius: 5,
                    backgroundColor,
                    background: backgroundColor,
                    color: backgroundColor === "yellow" || backgroundColor === "lightgray" ? "#222" : backgroundColor ? "#fff" : "inherit",
                    fontSize: 11,
                    lineHeight: 1.2,
                  }}
                >
                  {day.d}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", justifyContent: "space-between", alignItems: "center", rowGap: 6, columnGap: 8, marginTop: 8, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, backgroundColor: "red", borderRadius: 3 }}></span>
            <span>Sin horas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, backgroundColor: "yellow", borderRadius: 3 }}></span>
            <span>Parcial</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, backgroundColor: "lightgreen", borderRadius: 3 }}></span>
            <span>Completo</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, backgroundColor: "lightgray", borderRadius: 3 }}></span>
            <span>Festivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}


