import React from "react";
import "../../styles/BcModal.css";

export default function ValidationErrorsModal({
  isOpen,
  onClose,
  validation,
  onGoToError,
  onContinueAnyway,
}) {
  if (!isOpen) return null;

  const { errors, totalErrors, totalWarnings, summary } = validation;
  const canContinue = totalErrors === 0 && totalWarnings > 0; // Solo advertencias

  return (
    <div className="bc-modal-overlay" onClick={onClose}>
      <div className="bc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bc-modal-header">
          <h2 className="bc-modal-title">
            {totalErrors > 0
              ? "❌ Errores de Validación"
              : "⚠️ Advertencias de Validación"}
          </h2>
          <button className="bc-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bc-modal-content">
          {/* Resumen general */}
          <div className="validation-summary">
            <div className="summary-text" style={{ whiteSpace: "pre-line" }}>
              {summary}
            </div>
          </div>

          {/* Lista detallada de errores por línea */}
          {Object.keys(errors).length > 0 && (
            <div className="validation-details">
              <h3>📋 Detalles por línea:</h3>
              <div className="errors-list">
                {Object.entries(errors).map(([lineId, lineErrors]) => (
                  <div key={lineId} className="error-line">
                    <div className="line-header">
                      <span className="line-id">Línea {lineId}</span>
                      <button
                        className="go-to-error-btn"
                        onClick={() => onGoToError(lineId)}
                      >
                        Ir a línea
                      </button>
                    </div>
                    <div className="line-errors">
                      {Object.entries(lineErrors).map(([field, errorMsg]) => (
                        <div key={field} className="field-error">
                          <span className="field-name">{field}:</span>
                          <span className="error-message">{errorMsg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bc-modal-actions">
          {canContinue && (
            <button
              className="bc-modal-btn bc-modal-btn-secondary"
              onClick={onContinueAnyway}
            >
              Continuar de todas formas
            </button>
          )}
          <button
            className="bc-modal-btn bc-modal-btn-primary"
            onClick={onClose}
          >
            {totalErrors > 0 ? "Corregir Errores" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
