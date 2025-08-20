import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header, onHeaderChange }) {
  const { instance, accounts } = useMsal();
  const [resourceInfo, setResourceInfo] = useState(null);
  const [allocationPeriod, setAllocationPeriod] = useState("");
  const [editableHeader, setEditableHeader] = useState({
    resource_no: "",
    resource_name: "",
    department_code: "",
    calendar_type: "",
    allocation_period: "",
    posting_date: "",
    posting_description: "",
    calendar_period_days: "" // Nuevo campo
  });

  useEffect(() => {
    // Si no hay header, obtener información del recurso actual
    if (!header) {
      const getResourceInfo = async () => {
        try {
          // 🆕 Usar useMsal para obtener el email del usuario
          let userEmail = "";
          try {
            const acct = instance.getActiveAccount() || accounts[0];
            userEmail = acct?.username || acct?.email || "";
          } catch {
            userEmail = "";
          }

          if (userEmail) {
            // Consultar la tabla resource usando el campo email
            const { data: resourceData, error: resourceError } = await supabaseClient
              .from("resource")
              .select("code, name, department_code, calendar_type")
              .eq("email", userEmail)
              .single();

            if (resourceData) {
              setResourceInfo({
                user_email: userEmail,
                name: resourceData.name,
                department_code: resourceData.department_code,
                calendar_type: resourceData.calendar_type
              });

              // Obtener allocation_period de la URL
              const params = new URLSearchParams(window.location.search);
              let ap = params.get("allocation_period");
              if (!ap) {
                const now = new Date();
                const yy = String(now.getFullYear()).slice(-2);
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                ap = `M${yy}-M${mm}`;
              }
              setAllocationPeriod(ap);

              // Establecer valores por defecto
              const firstDayOfPeriod = getFirstDayOfPeriod(ap);

                            // 🆕 Calcular fecha sugerida: último día del mes siguiente al último timesheet
              let suggestedDate = new Date().toISOString().split('T')[0]; // Fallback a fecha actual
              try {
                const { data: lastHeader } = await supabaseClient
                  .from("resource_timesheet_header")
                  .select("to_date")
                  .eq("resource_no", resourceData.code)
                  .order("to_date", { ascending: false })
                  .limit(1)
                  .single();
                
                if (lastHeader?.to_date) {
                  const lastDate = new Date(lastHeader.to_date);
                  // ✅ Calcular correctamente: último día del mes siguiente
                  const nextMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
                  const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
                  suggestedDate = lastDayOfNextMonth.toISOString().split('T')[0];
                }
              } catch (error) {
                // Si hay error, usar fecha actual como fallback
              }
              
              // ✅ Calcular el período correcto basado en la fecha sugerida
              const correctPeriod = getPeriodFromDate(suggestedDate);
              
              const newEditableHeader = {
                resource_no: resourceData.code, // Usar code del recurso
                resource_name: resourceData.name,
                department_code: resourceData.department_code,
                calendar_type: resourceData.calendar_type,
                allocation_period: correctPeriod, // ✅ Usar período calculado de la fecha sugerida
                posting_date: suggestedDate, // ✅ Usar fecha sugerida calculada
                posting_description: `Parte de trabajo ${correctPeriod}`, // ✅ Usar período correcto en descripción
                calendar_period_days: "" // Se llenará cuando se seleccione la fecha
              };

              setEditableHeader(newEditableHeader);

              // 🆕 Notificar inmediatamente al componente padre
              if (onHeaderChange) {
                onHeaderChange(newEditableHeader);
              }
            } else if (resourceError) {
              // Fallback: crear header con información básica
              const params = new URLSearchParams(window.location.search);
              let ap = params.get("allocation_period");
              if (!ap) {
                const now = new Date();
                const yy = String(now.getFullYear()).slice(-2);
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                ap = `M${yy}-M${mm}`;
              }

              const firstDayOfPeriod = getFirstDayOfPeriod(ap);
              const fallbackHeader = {
                resource_no: userEmail, // Fallback al email si no se encuentra el recurso
                resource_name: userEmail,
                department_code: "DEFAULT",
                calendar_type: "MAD INT",
                allocation_period: ap,
                posting_date: new Date().toISOString().split('T')[0], // Fecha de hoy
                posting_description: `Parte de trabajo ${ap}`,
                calendar_period_days: ""
              };

              setEditableHeader(fallbackHeader);
              if (onHeaderChange) {
                onHeaderChange(fallbackHeader);
              }
            }
          }
        } catch (error) {
          // Error silencioso
        }
      };

      getResourceInfo();
    }
  }, [header, onHeaderChange, instance, accounts]);

  // Función para obtener el primer día del período
  const getFirstDayOfPeriod = (ap) => {
    const m = /^M(\d{2})-M(\d{2})$/.exec(ap || "");
    if (!m) return new Date().toISOString().split('T')[0];

    const yy = parseInt(m[1], 10);
    const year = 2000 + yy;
    const month = parseInt(m[2], 10);

    return new Date(year, month - 1, 1).toISOString().split('T')[0];
  };

  // Función para obtener el período correspondiente a una fecha
  const getPeriodFromDate = (date) => {
    if (!date) return "";

    try {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // getMonth() devuelve 0-11

      const yy = String(year).slice(-2); // Últimos 2 dígitos del año
      const mm = String(month).padStart(2, "0"); // Mes con 2 dígitos

      return `M${yy}-M${mm}`;
    } catch (error) {
      console.error("❌ Error calculando período:", error);
      return "";
    }
  };

  // Función para obtener calendar_period_days del calendario del recurso
  const getCalendarPeriodDays = async (postingDate, calendarType, allocationPeriod) => {
    if (!postingDate || !calendarType || !allocationPeriod) return "";

    try {
      const { data, error } = await supabaseClient
        .from("calendar_period_days")
        .select("day, hours_working, holiday")
        .eq("allocation_period", allocationPeriod)
        .eq("calendar_code", calendarType)
        .eq("day", postingDate)
        .single();

      if (error) {
        return "";
      }

      if (data) {
        return data.day; // Retornar el día que coincide
      }

      return "";
    } catch (error) {
      return "";
    }
  };

  // Manejar cambios en los campos editables
  const handleFieldChange = async (field, value) => {
    const newHeader = { ...editableHeader, [field]: value };

    // Si se cambió la fecha del parte, actualizar período y calendar_period_days
    if (field === "posting_date" && value) {
      const newPeriod = getPeriodFromDate(value);
      newHeader.allocation_period = newPeriod;

      // Si tenemos calendar_type, buscar calendar_period_days
      if (newHeader.calendar_type) {
        const calendarPeriodDays = await getCalendarPeriodDays(value, newHeader.calendar_type, newPeriod);
        newHeader.calendar_period_days = calendarPeriodDays;
      }


    }

    setEditableHeader(newHeader);

    // Notificar al padre con la información actualizada
    if (onHeaderChange) {
      onHeaderChange(newHeader);
    }
  };

  if (!header && !resourceInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Cargando información del recurso...
      </div>
    );
  }

  if (!header) {
    // Mostrar cabecera editable para nuevo parte
    return (
      <div style={{
        padding: "20px",
        border: "2px dashed #007bff",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Recurso:
            </label>
            <input
              type="text"
              value={editableHeader.resource_no}
              readOnly
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f5f5f5",
                color: "#666"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Nombre:
            </label>
            <input
              type="text"
              value={editableHeader.resource_name}
              readOnly
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f5f5f5",
                color: "#666"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Calendario:
            </label>
            <input
              type="text"
              value={editableHeader.calendar_type}
              readOnly
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f5f5f5",
                color: "#666"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Fecha:
            </label>
            <input
              type="date"
              value={editableHeader.posting_date}
              readOnly // 🆕 Fecha del parte no editable - se calcula automáticamente
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f5f5f5", // 🎨 Estilo visual para campos no editables
                color: "#666"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Período:
            </label>
            <input
              type="text"
              value={editableHeader.allocation_period}
              readOnly
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f5f5f5",
                color: "#666"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Descripción:
            </label>
            <input
              type="text"
              value={editableHeader.posting_description}
              onChange={(e) => handleFieldChange("posting_description", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
        </div>
      </div>
    );
  }

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
