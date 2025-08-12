import React from "react";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header }) {
  if (!header) return null;

  // Define shared td style for border, padding, alignment, and merge with existing
  const tdBaseStyle = {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "left",
  };
  return (
    <table className="timesheet-header" style={{
      width: "100%",
      marginBottom: "20px",
      borderCollapse: "collapse",
    }}>
      <tbody>
        <tr>
          <td style={{ ...tdBaseStyle, width: "25%", fontWeight: "bold" }}>Nº</td>
          <td style={{ ...tdBaseStyle, width: "25%" }}>{header.id}</td>
          <td style={{ ...tdBaseStyle, width: "25%", fontWeight: "bold" }}>Fecha registro</td>
          <td style={{ ...tdBaseStyle, width: "25%" }}>{new Date(header.created_at).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Nº recurso</td>
          <td style={tdBaseStyle}>{header.resource_no}</td>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Fecha parte</td>
          <td style={tdBaseStyle}>{header.posting_date}</td>
        </tr>
        <tr>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Descripción</td>
          <td style={tdBaseStyle}>{header.posting_description}</td>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Texto registro</td>
          <td style={tdBaseStyle}>{header.posting_description}</td>
        </tr>
        <tr>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Código departamento</td>
          <td style={tdBaseStyle}>{header.department_code}</td>
          <td style={{ ...tdBaseStyle, fontWeight: "bold" }}>Enviado a BC</td>
          <td style={tdBaseStyle}>{header.synced_to_bc ? "✅" : "❌"}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default TimesheetHeader;
