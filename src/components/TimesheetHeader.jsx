import React from "react";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header }) {
  if (!header) return null;

  return (
    <table className="timesheet-header">
      <tbody>
        <tr>
          <th>
            <span className="th-label">Nº</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.id}</td>

          <th>
            <span className="th-label">Fecha registro</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{new Date(header.created_at).toLocaleDateString()}</td>
        </tr>

        <tr>
          <th>
            <span className="th-label">Nº recurso</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.resource_no}</td>

          <th>
            <span className="th-label">Fecha parte</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.posting_date}</td>
        </tr>

        <tr>
          <th>
            <span className="th-label">Descripción</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.posting_description}</td>

          <th>
            <span className="th-label">Texto registro</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.posting_description}</td>
        </tr>

        <tr>
          <th>
            <span className="th-label">Código departamento</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.department_code}</td>

          <th>
            <span className="th-label">Enviado a BC</span>
            <span className="th-leader" aria-hidden="true"></span>
          </th>
          <td>{header.synced_to_bc ? "✅" : "❌"}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default TimesheetHeader;
