import React, { useState, useEffect } from "react";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header }) {
  const [resourceInfo, setResourceInfo] = useState(null);
  const [allocationPeriod, setAllocationPeriod] = useState("");

  useEffect(() => {
    // Si no hay header, obtener información del recurso actual
    if (!header) {
      const getResourceInfo = async () => {
        try {
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
            const { data: resourceData } = await supabaseClient
              .from("resource")
              .select("no, name, department_code, company")
              .eq("email", user.email)
              .single();
            
            if (resourceData) {
              setResourceInfo(resourceData);
            }
          }
        } catch (error) {
          console.error("Error obteniendo información del recurso:", error);
        }
      };

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

      getResourceInfo();
    }
  }, [header]);

  if (!header && !resourceInfo) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Cargando información del recurso...
      </div>
    );
  }

  if (!header) {
    // Mostrar información para nuevo parte
    return (
      <div style={{ 
        padding: "20px", 
        border: "2px dashed #007bff", 
        borderRadius: "8px", 
        backgroundColor: "#f8f9fa",
        textAlign: "center"
      }}>
        <h3 style={{ color: "#007bff", marginBottom: "16px" }}>
          🆕 Nuevo Parte de Trabajo
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left" }}>
          <div>
            <strong>Período:</strong> {allocationPeriod}
          </div>
          <div>
            <strong>Recurso:</strong> {resourceInfo?.no} - {resourceInfo?.name}
          </div>
          <div>
            <strong>Departamento:</strong> {resourceInfo?.department_code}
          </div>
          <div>
            <strong>Empresa:</strong> {resourceInfo?.company}
          </div>
        </div>
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          backgroundColor: "#e7f3ff", 
          borderRadius: "6px",
          fontSize: "14px",
          color: "#0056b3"
        }}>
          💡 Agrega líneas de trabajo usando el botón "Agregar Línea" y luego guarda el parte
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
