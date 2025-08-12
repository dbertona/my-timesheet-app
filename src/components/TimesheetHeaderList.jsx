import React from "react";
import { useEffect, useState } from "react";
import { supabaseClient } from "../supabaseClient.js";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import "../styles/TimesheetHeaderList.css";

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

  return (
    <div>
      <h2>Partes de Trabajo</h2>
      {headers.length === 0 ? (
        <p>No hay cabeceras disponibles.</p>
      ) : (
        <>
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Fecha parte</th>
                <th>Descripción</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Período</th>
                <th>Calendario</th>
                <th>Departamento</th>
                <th>Enviado a BC</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => (
                <tr key={header.id}>
                  <td>{header.resource_no}</td>
                  <td>{header.posting_date}</td>
                  <td>{header.posting_description}</td>
                  <td>{header.from_date}</td>
                  <td>{header.to_date}</td>
                  <td>{header.allocation_period}</td>
                  <td>{header.resource_calendar}</td>
                  <td>{header.department_code}</td>
                  <td>{header.synced_to_bc ? "✅" : "❌"}</td>
                  <td>
                    <button
                      onClick={() => {
                        console.log("Editar pulsado, id:", header.id);
                        navigate(`/edit/${header.id}`);
                      }}
                      disabled={header.synced_to_bc}
                      className="edit-button"
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
