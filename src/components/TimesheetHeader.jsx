import React, { useState, useEffect } from "react";
import { supabaseClient } from "../supabaseClient";
import "../styles/TimesheetHeader.css";

function TimesheetHeader({ header, onHeaderChange }) {
  const [resourceInfo, setResourceInfo] = useState(null);
  const [allocationPeriod, setAllocationPeriod] = useState("");
  const [editableHeader, setEditableHeader] = useState({
    resource_no: "",
    resource_name: "",
    department_code: "",
    company: "",
    allocation_period: "",
    posting_date: "",
    posting_description: ""
  });

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
              setEditableHeader({
                resource_no: resourceData.no,
                resource_name: resourceData.name,
                department_code: resourceData.department_code,
                company: resourceData.company,
                allocation_period: ap,
                posting_date: firstDayOfPeriod,
                posting_description: `Parte de trabajo ${ap}`
              });
            }
          }
        } catch (error) {
          console.error("Error obteniendo información del recurso:", error);
        }
      };

      getResourceInfo();
    }
  }, [header]);

  // Función para obtener el primer día del período
  const getFirstDayOfPeriod = (ap) => {
    const m = /^M(\d{2})-M(\d{2})$/.exec(ap || "");
    if (!m) return new Date().toISOString().split('T')[0];
    
    const yy = parseInt(m[1], 10);
    const year = 2000 + yy;
    const month = parseInt(m[2], 10);
    
    const firstDay = new Date(year, month - 1, 1);
    return firstDay.toISOString().split('T')[0];
  };

  // Función para manejar cambios en los campos editables
  const handleFieldChange = (field, value) => {
    const newHeader = { ...editableHeader, [field]: value };
    setEditableHeader(newHeader);
    
    // Notificar cambios al componente padre
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
        <h3 style={{ color: "#007bff", marginBottom: "16px", textAlign: "center" }}>
          🆕 Nuevo Parte de Trabajo
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Nº Recurso:
            </label>
            <input
              type="text"
              value={editableHeader.resource_no}
              onChange={(e) => handleFieldChange("resource_no", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Nombre Recurso:
            </label>
            <input
              type="text"
              value={editableHeader.resource_name}
              onChange={(e) => handleFieldChange("resource_name", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
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
              onChange={(e) => handleFieldChange("allocation_period", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Fecha Parte:
            </label>
            <input
              type="date"
              value={editableHeader.posting_date}
              onChange={(e) => handleFieldChange("posting_date", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Departamento:
            </label>
            <input
              type="text"
              value={editableHeader.department_code}
              onChange={(e) => handleFieldChange("department_code", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
              Empresa:
            </label>
            <input
              type="text"
              value={editableHeader.company}
              onChange={(e) => handleFieldChange("company", e.target.value)}
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
        
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          backgroundColor: "#e7f3ff", 
          borderRadius: "6px",
          fontSize: "14px",
          color: "#0056b3"
        }}>
          💡 Completa la información de la cabecera y agrega líneas de trabajo
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
