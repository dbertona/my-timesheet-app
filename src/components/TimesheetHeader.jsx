import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header, onHeaderChange }) {
  const { instance, accounts } = useMsal();
  const [resourceInfo, setResourceInfo] = useState(null);
  // Eliminado allocationPeriod sin uso para cumplir lint
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
  const [headerErrors, setHeaderErrors] = useState({}); // 🆕 Errores de validación de la cabecera
  const [resourceNotFound, setResourceNotFound] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState("");

  // 🆕 Estado para effectiveHeader (debe estar aquí para mantener orden de hooks)
  const [effectiveHeader, setEffectiveHeader] = useState(header || editableHeader);

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
              .maybeSingle();

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
                // 🆕 CORREGIR: getMonth() devuelve 0-11, donde 0=enero, 7=agosto
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                ap = `M${yy}-M${mm}`;
              }
              // allocationPeriod local eliminado; se usa directamente en editableHeader

              // Establecer valores por defecto
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
                  suggestedDate = lastHeader.to_date;
                }
              } catch {}

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
            } else {
              // No encontrado por email: NO asumir nada ni buscar alternativas
              setResourceNotFound(true);
              setNotFoundMsg(`Recurso no encontrado para el email ${userEmail}. Comprueba la tabla 'resource'.`);
              // Limpiar cualquier cabecera editable previa
              setEditableHeader({
                resource_no: "",
                resource_name: "",
                department_code: "",
                calendar_type: "",
                allocation_period: "",
                posting_date: "",
                posting_description: "",
                calendar_period_days: ""
              });
              if (onHeaderChange) onHeaderChange(null);
            }
          } else {
            setResourceNotFound(true);
            setNotFoundMsg("No se pudo obtener el email del usuario desde MSAL.");
          }
        } catch (error) {
          setResourceNotFound(true);
          setNotFoundMsg("Error obteniendo la información del recurso.");
        }
      };

      getResourceInfo();
    }
  }, [header, onHeaderChange, instance, accounts]);

  // 🆕 Segundo useEffect para actualizar effectiveHeader (debe estar aquí para mantener orden)
  useEffect(() => {
    if (header && (!header.resource_name || !header.calendar_type)) {
      // Consultar la tabla resource para obtener nombre y tipo de calendario
      const getResourceDetails = async () => {
        try {
          const { data: resourceData, error } = await supabaseClient
            .from("resource")
            .select("name, calendar_type")
            .eq("code", header.resource_no)
            .maybeSingle();

          if (resourceData && !error) {
            setEffectiveHeader({
              ...header,
              resource_name: resourceData.name,
              calendar_type: resourceData.calendar_type
            });
          }
        } catch (error) {}
      };

      getResourceDetails();
    } else {
      setEffectiveHeader(header || editableHeader);
    }
  }, [header, editableHeader]);

  // Función para obtener el período correspondiente a una fecha
  const getPeriodFromDate = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `M${yy}-M${mm}`;
    } catch { return ""; }
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

      if (error) { return ""; }

      if (data) {
        return data.day; // Retornar el día que coincide
      }

      return "";
    } catch (error) { return ""; }
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

  if (resourceNotFound) {
    return (
      <div style={{ padding: 20, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
        {notFoundMsg}
      </div>
    );
  }

  // 🆕 Cabecera unificada para inserción y edición
  const isEditMode = !!header;

  return (
    <div style={{
      padding: "20px",
      border: isEditMode ? "1px solid #ddd" : "2px dashed #007bff",
      borderRadius: "8px",
      backgroundColor: isEditMode ? "#ffffff" : "#f8f9fa"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        fontSize: "14px"
      }}>
        {/* Recurso */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Recurso:
          </label>
          <input
            type="text"
            value={effectiveHeader.resource_no}
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

        {/* Nombre */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Nombre:
          </label>
          <input
            type="text"
            value={effectiveHeader.resource_name}
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

        {/* Calendario */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Calendario:
          </label>
          <input
            type="text"
            value={effectiveHeader.calendar_type}
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

        {/* Fecha */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Fecha:
          </label>
          <input
            type="date"
            value={effectiveHeader.posting_date}
            readOnly // ✅ Fecha no editable ni en inserción ni en edición
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
          {/* ✅ Mostrar error de fecha ocupada solo en edición */}
          {isEditMode && headerErrors.posting_date && (
            <div style={{
              color: "#dc3545",
              fontSize: "12px",
              marginTop: "4px",
              fontWeight: "500"
            }}>
              ⚠️ {headerErrors.posting_date}
            </div>
          )}
        </div>

        {/* Período */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Período:
          </label>
          <input
            type="text"
            value={effectiveHeader.allocation_period}
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

        {/* Descripción */}
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
            Descripción:
          </label>
          <input
            type="text"
            value={effectiveHeader.posting_description}
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
