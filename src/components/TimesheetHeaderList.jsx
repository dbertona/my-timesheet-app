import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TimesheetHeaderList.css";
import { supabaseClient } from "../supabaseClient.js";

function TimesheetHeaderList({ headers: propHeaders }) {
  // Componente TimesheetHeaderList renderizado
  console.log("🔍 TimesheetHeaderList renderizado con headers:", propHeaders);
  const { accounts } = useMsal();
  const [headers, setHeaders] = useState(propHeaders || []);
  const navigate = useNavigate();

  console.log("🔍 Headers state:", headers);
  console.log("🔍 Accounts:", accounts);

  useEffect(() => {
    console.log("🔍 useEffect ejecutado, propHeaders:", propHeaders);
    if (propHeaders) {
      console.log("🔍 Usando propHeaders, no cargando datos");
      return; // No cargar datos si vienen por prop
    }

    const fetchData = async () => {
      const email = accounts[0]?.username;
      console.log("🔍 Email del usuario:", email);
      // Usuario logueado
      if (!email) {
        console.log("🔍 No hay email, saliendo");
        return;
      }

      console.log("🔍 Cargando datos de Supabase...");
      const { data, error } = await supabaseClient
        .from("resource_timesheet_header")
        .select("*")
        .eq("user_email", email);

      if (error) {
        console.error("❌ Error al cargar cabeceras:", error.message);
      } else {
        console.log("🔍 Cabeceras recibidas de Supabase:", data);
        // Cabeceras recibidas
        setHeaders(data);
      }
    };

    fetchData();
  }, [accounts, propHeaders]);

  console.log("🔍 Renderizando componente, headers.length:", headers.length);

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
                    {(() => {
                      // Debug: mostrar el valor y tipo
                      console.log(`Header ${header.id}: synced_to_bc =`, header.synced_to_bc, typeof header.synced_to_bc);
                      const isSynced = header.synced_to_bc === true || header.synced_to_bc === 'true';
                      return isSynced;
                    })() ? (
                      <button
                        onClick={() => {
                          // Ver pulsado - reutilizamos vista de edición como solo lectura
                          navigate(`/edit/${header.id}`);
                        }}
                        className="view-button"
                      >
                        Ver
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Editar pulsado
                          navigate(`/edit/${header.id}`);
                        }}
                        className="edit-button"
                      >
                        Editar
                      </button>
                    )}
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
