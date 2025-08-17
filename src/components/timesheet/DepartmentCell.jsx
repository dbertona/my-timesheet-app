import React from "react";
import "../../styles/TimesheetLines.css";

export default function DepartmentCell({
  line,
  lineIndex,
  colStyle,
  align,
}) {
  return (
    <td
      className="ts-td"
      style={{
        ...colStyle,
        textAlign: align,
        backgroundColor: "#f8f9fa", // Color de fondo para indicar que no es editable
        color: "#6c757d", // Color de texto más suave
        cursor: "default", // Cursor normal (no pointer)
      }}
      data-col="department_code"
    >
      <div
        className="ts-cell-content"
        style={{
          padding: "8px 12px",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {line.department_code || (
          <span style={{ fontStyle: "italic", color: "#adb5bd" }}>
            Sin departamento
          </span>
        )}
      </div>
    </td>
  );
}
