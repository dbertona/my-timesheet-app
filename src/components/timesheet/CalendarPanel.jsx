import React, { useRef, useEffect, useState } from "react";
import BcCard from "../ui/BcCard";

export default function CalendarPanel({
  calRange,
  firstOffset,
  calendarDays,
  requiredSum,
  imputedSum,
  missingSum,
  rightPadState,
}) {
  const calendarBoxRef = useRef(null);
  const [rightPad, setRightPad] = rightPadState; // [value, setter]
  const [calendarHeight, setCalendarHeight] = useState(0);

  useEffect(() => {
    const updateRightPad = () => {
      try {
        const el = calendarBoxRef.current;
        const w = el ? el.offsetWidth : 0;
        const SAFE_GAP_RIGHT = 36;
        setRightPad((w || 0) + SAFE_GAP_RIGHT);
        const h = el ? el.offsetHeight : 0;
        setCalendarHeight(h || 0);
      } catch {}
    };
    updateRightPad();
    window.addEventListener("resize", updateRightPad);
    let ro;
    if (window.ResizeObserver && calendarBoxRef.current) {
      ro = new ResizeObserver(updateRightPad);
      ro.observe(calendarBoxRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateRightPad);
      if (ro && calendarBoxRef.current) ro.disconnect();
    };
  }, [setRightPad]);

  return (
    <div style={{ position: "relative", marginBottom: 12, minHeight: calendarHeight }}>
      <div style={{ position: "absolute", top: 0, right: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <BcCard title="Resumen mes" compact>
          <div className="summary-grid">
            <span>Requeridas</span><strong>{requiredSum.toFixed(2)}</strong>
            <span>Imputadas</span><strong>{imputedSum.toFixed(2)}</strong>
            <span>Faltan</span><strong>{missingSum.toFixed(2)}</strong>
          </div>
        </BcCard>

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
                <div key={day.iso} style={{ textAlign: "center" }} title={`${day.iso} • Req: ${day.need} • Imp: ${day.got}`}>
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
    </div>
  );
}


