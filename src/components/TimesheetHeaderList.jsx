import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TimesheetHeaderList.css";
import { supabaseClient } from "../supabaseClient.js";

function TimesheetHeaderList({ headers: propHeaders }) {
  // Componente TimesheetHeaderList renderizado
  const { accounts } = useMsal();
  const [headers, setHeaders] = useState(propHeaders || []);
  const navigate = useNavigate();

  useEffect(() => {
    if (propHeaders) return; // No cargar datos si vienen por prop

    const fetchData = async () => {
      const email = accounts[0]?.username;
      // Usuario logueado
      if (!email) return;

      const { data, error } = await supabaseClient
        .from("resource_timesheet_header")
        .select("*")
        .eq("user_email", email);

      if (error) {
        console.error("❌ Error al cargar cabeceras:", error.message);
      } else {
        // Cabeceras recibidas
        setHeaders(data);
      }
    };

    fetchData();
  }, [accounts, propHeaders]);

  return (
    <div>
      <h2 className="timesheet-title">Partes de Horas</h2>
      {headers.length === 0 ? (
        <p>No hay cabeceras disponibles.</p>
      ) : (
        <>
          <table className="timesheet-table">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Recurso</th>
                <th style={{ textAlign: "center" }}>Fecha parte</th>
                <th style={{ textAlign: "center" }}>Descripción</th>
                <th style={{ textAlign: "center" }}>Desde</th>
                <th style={{ textAlign: "center" }}>Hasta</th>
                <th style={{ textAlign: "center" }}>Período</th>
                <th style={{ textAlign: "center" }}>Calendario</th>
                <th style={{ textAlign: "center" }}>Departamento</th>
                <th style={{ textAlign: "center" }}>Enviado a BC</th>
                <th style={{ textAlign: "center" }}></th>
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
                        // Editar pulsado
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
