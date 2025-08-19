import React from "react";
import "../../styles/TimesheetLines.css";

export default function DepartmentCell({
  line,
  lineIndex,
  colStyle,
  align,
  editFormData, // ✅ Recibir editFormData para mostrar valor actualizado
}) {
  // ✅ Usar editFormData si está disponible, sino usar line
  const departmentCode = editFormData?.[line.id]?.department_code || line.department_code;
  
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
        {departmentCode || (
          <span style={{ fontStyle: "italic", color: "#adb5bd" }}>
            Sin departamento
          </span>
        )}
      </div>
    </td>
  );
}
