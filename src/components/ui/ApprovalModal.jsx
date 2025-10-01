import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  availableDays,
  title = "Enviar para Aprobación",
}) {
  const [selectedDays, setSelectedDays] = useState(new Set());

  // Inicializar con todos los días seleccionados por defecto
  React.useEffect(() => {
    if (isOpen && availableDays.length > 0) {
      const allDays = new Set(availableDays.map((day) => day.date));
      setSelectedDays(allDays);
    }
  }, [isOpen, availableDays]);

  const handleDayToggle = (dayDate) => {
    setSelectedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayDate)) {
        newSet.delete(dayDate);
      } else {
        newSet.add(dayDate);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDays.size === availableDays.length) {
      setSelectedDays(new Set());
    } else {
      const allDays = new Set(availableDays.map((day) => day.date));
      setSelectedDays(allDays);
    }
  };

  const handleConfirm = () => {
    const selectedDaysArray = Array.from(selectedDays);
    onConfirm(selectedDaysArray);
    onClose();
  };

  const formatDayDisplay = (isoDate) => {
    const date = new Date(isoDate);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  if (!isOpen) return null;

  return (
    <div className="ts-modal-overlay" onClick={onClose}>
      <div
        className="ts-modal ts-modal--medium"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>

        <div className="ts-modal-content">
          <p>
            Selecciona los días completos que deseas enviar para aprobación:
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedDays.size === availableDays.length}
                onChange={handleSelectAll}
              />
              <strong>Seleccionar todos ({availableDays.length} días)</strong>
            </label>
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {availableDays.map((day) => (
              <div
                key={day.date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.has(day.date)}
                  onChange={() => handleDayToggle(day.date)}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>
                    {formatDayDisplay(day.date)}
                  </div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>
                    {day.imputedHours}h imputadas de {day.requiredHours}h
                    requeridas
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <strong>
              {selectedDays.size} de {availableDays.length} días seleccionados
            </strong>
          </div>
        </div>

        <div className="ts-modal-actions">
          <button
            onClick={handleConfirm}
            className="ts-btn ts-btn--primary"
            disabled={selectedDays.size === 0}
          >
            Enviar Aprobación ({selectedDays.size})
          </button>
          <button onClick={onClose} className="ts-btn ts-btn--secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
