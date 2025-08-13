import React from "react";

// Wrapper genérico para una celda editable de la grilla.
// Gestiona focus/select, navegación y render del error debajo.
export default function EditableCell({
  children,
  error,
  inputRef,
  className,
  onFocus,
  onKeyDown,
  style,
  errorId,
}) {
  return (
    <td className={`ts-td ts-cell ${className || ""}`} style={style}>
      <div className="ts-cell">
        {children}
      </div>
      {error && (
        <div style={{ position: "static", marginTop: 4 }}>
          <span id={errorId} className="ts-inline-error" role="alert" aria-live="polite">
            <span className="ts-inline-error__dot" />
            {error}
          </span>
        </div>
      )}
    </td>
  );
}


