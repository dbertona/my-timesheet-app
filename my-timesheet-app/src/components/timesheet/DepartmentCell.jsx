import React from "react";
import "../../styles/TimesheetLines.css";

export default function DepartmentCell({
  line,
  colStyle,
  align,
  editFormData, // ✅ Recibir editFormData para mostrar valor actualizado
}) {
  // ✅ Usar editFormData si está disponible, sino usar line
  const departmentCode =
    editFormData?.[line.id]?.department_code || line.department_code;

  return (
    <td
      className="ts-td"
      style={{
        ...colStyle,
        textAlign: align,
        backgroundColor: "#ffffff", // Color de fondo blanco
        color: "#000000", // Color de texto negro
        cursor: "default", // Cursor normal (no pointer)
      }}
      data-col="department_code"
    >
      <div
        className="ts-cell-content"
        style={{
          padding: "0px 1px",
          fontSize: "10px",
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
