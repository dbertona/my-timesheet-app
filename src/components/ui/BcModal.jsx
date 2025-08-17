import React from "react";

export default function BcModal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = "Sí",
  cancelText = "No",
  onConfirm,
  onCancel,
  confirmButtonType = "danger", // "danger" o "primary"
  showActions = true,
  size = "medium" // "small", "medium", "large"
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const sizeClasses = {
    small: "ts-modal--small",
    medium: "ts-modal--medium",
    large: "ts-modal--large"
  };

  return (
    <div className="ts-modal-overlay" onClick={onClose}>
      <div 
        className={`ts-modal ${sizeClasses[size]}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3>{title}</h3>
        )}
        
        <div className="ts-modal-content">
          {children}
        </div>

        {showActions && (
          <div className="ts-modal-actions">
            <button 
              onClick={handleConfirm} 
              className={`ts-btn ts-btn--${confirmButtonType}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={handleCancel} 
              className="ts-btn ts-btn--secondary"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
