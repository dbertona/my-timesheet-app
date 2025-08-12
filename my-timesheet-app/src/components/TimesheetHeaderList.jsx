import React from "react";
import { useEffect, useState } from "react";
import { supabaseClient } from "../supabaseClient.js";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

function TimesheetHeaderList({ headers: propHeaders }) {
  console.log("✅ Componente TimesheetHeaderList renderizado");
  const { accounts } = useMsal();
  const [headers, setHeaders] = useState(propHeaders || []);
  const navigate = useNavigate();

  useEffect(() => {
    if (propHeaders) return; // No cargar datos si vienen por prop

    const fetchData = async () => {
      const email = accounts[0]?.username;
      console.log("📧 Usuario logueado:", email);
      if (!email) return;

      const { data, error } = await supabaseClient
        .from("resource_timesheet_header")
        .select("*")
        .eq("user_email", email);

      if (error) {
        console.error("❌ Error al cargar cabeceras:", error.message);
      } else {
        console.log("📦 Cabeceras recibidas:", data);
        setHeaders(data);
      }
    };

    fetchData();
  }, [accounts, propHeaders]);

  const tableStyle = { width: "100%", borderCollapse: "collapse" };
  const thStyle = { border: "1px solid #ddd", padding: "8px", textAlign: "left", background: "#fafafa" };
  const tdStyle = { border: "1px solid #ddd", padding: "8px", textAlign: "left" };

  return (
    <div>
      <h2>Partes de Trabajo</h2>
      {headers.length === 0 ? (
        <p>No hay cabeceras disponibles.</p>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Recurso</th>
                <th style={thStyle}>Fecha parte</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Desde</th>
                <th style={thStyle}>Hasta</th>
                <th style={thStyle}>Período</th>
                <th style={thStyle}>Calendario</th>
                <th style={thStyle}>Departamento</th>
                <th style={thStyle}>Enviado a BC</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => (
                <tr key={header.id}>
                  <td style={tdStyle}>{header.resource_no}</td>
                  <td style={tdStyle}>{header.posting_date}</td>
                  <td style={tdStyle}>{header.posting_description}</td>
                  <td style={tdStyle}>{header.from_date}</td>
                  <td style={tdStyle}>{header.to_date}</td>
                  <td style={tdStyle}>{header.allocation_period}</td>
                  <td style={tdStyle}>{header.resource_calendar}</td>
                  <td style={tdStyle}>{header.department_code}</td>
                  <td style={tdStyle}>{header.synced_to_bc ? "✅" : "❌"}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => {
                        console.log("Editar pulsado, id:", header.id);
                        navigate(`/edit/${header.id}`);
                      }}
                      disabled={header.synced_to_bc}
                      style={{
                        backgroundColor: header.synced_to_bc ? "#ccc" : "#007E87",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: header.synced_to_bc ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={
                        header.synced_to_bc
                          ? undefined
                          : e => (e.currentTarget.style.backgroundColor = "#0056b3")
                      }
                      onMouseOut={
                        header.synced_to_bc
                          ? undefined
                          : e => (e.currentTarget.style.backgroundColor = "#007E87")
                      }
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default TimesheetHeaderList;
