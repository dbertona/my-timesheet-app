import { useMsal } from "@azure/msal-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TimesheetListPage.css";
import { supabaseClient } from "../supabaseClient";
import BackToDashboard from "./ui/BackToDashboard";

function TimesheetListPage() {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSynced, setFilterSynced] = useState("all"); // 'all' | 'yes' | 'no'

  const userEmail = accounts[0]?.username;

  // Refs para responsive (igual patrón que edición/aprobación)
  const pageRef = useRef(null);
  const headerBarRef = useRef(null);
  const filtersRef = useRef(null);
  const tableContainerRef = useRef(null); // .ts-responsive

  const recalcHeights = () => {
    try {
      if (!tableContainerRef.current) return;

      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const tableRect = tableContainerRef.current.getBoundingClientRect();
      const top = tableRect.top; // calcular desde la parte superior del contenedor scrollable
      const available = Math.max(0, Math.floor(viewportH - top));

      // Asignar altura al contenedor scrollable
      tableContainerRef.current.style.height = `${available}px`;
      tableContainerRef.current.style.maxHeight = `${available}px`;
      tableContainerRef.current.style.overflowY = "auto";
    } catch {
      /* noop */
    }
  };

  useLayoutEffect(() => {
    recalcHeights();
    const onResize = () => recalcHeights();
    window.addEventListener("resize", onResize);

    // ResizeObserver para cambios de layout locales (como en edición)
    const ro = new ResizeObserver(() => recalcHeights());
    if (filtersRef.current) ro.observe(filtersRef.current);
    if (headerBarRef.current) ro.observe(headerBarRef.current);
    if (pageRef.current) ro.observe(pageRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      try { ro.disconnect(); } catch { /* ignore */ }
    };
  }, []);

  // Evitar scroll de documento, como en Aprobación/Edición
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  // Cargar partes de trabajo del usuario
  useEffect(() => {
    const loadTimesheetHeaders = async () => {
      if (!userEmail) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener el recurso del usuario
        const { data: resourceData, error: resourceError } = await supabaseClient
          .from("resource")
          .select("code, name")
          .eq("email", userEmail)
          .single();

        if (resourceError || !resourceData) {
          setError("No se pudo obtener la información del recurso");
          return;
        }

        // Construir query base
        let query = supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("resource_no", resourceData.code)
          .order("allocation_period", { ascending: false, nullsFirst: false })
          .order("posting_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false, nullsFirst: false });

        // Aplicar filtros
        if (filterSynced !== "all") {
          const value = filterSynced === "yes";
          query = query.eq("synced_to_bc", value);
        }

        const { data, error: headersError } = await query;

        if (headersError) {
          setError("Error cargando los partes de trabajo");
          return;
        }

        setHeaders(data || []);
      } catch (err) {
        console.error("Error cargando partes:", err);
        setError("Error inesperado cargando los datos");
      } finally {
        setLoading(false);
      }
    };

    loadTimesheetHeaders();
  }, [userEmail, filterSynced]);

  // Manejar selección de parte
  const handleSelectTimesheet = (headerId) => {
    navigate(`/edit/${headerId}`);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Obtener clases CSS para el estado
  const getStatusClass = (status) => {
    switch (status) {
      case "Draft": return "status-draft";
      case "Pending": return "status-pending";
      case "Approved": return "status-approved";
      case "Rejected": return "status-rejected";
      default: return "status-unknown";
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case "Draft": return "Borrador";
      case "Pending": return "Pendiente";
      case "Approved": return "Aprobado";
      case "Rejected": return "Rechazado";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="timesheet-list-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando partes de horas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timesheet-list-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="ts-btn ts-btn--primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timesheet-list-page" ref={pageRef}>
      <div
        className="ts-header-bar"
        ref={headerBarRef}
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <BackToDashboard compact={true} />
        <h1
          className="ts-page-title"
          style={{
            color: "#007E87",
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1,
            position: "relative",
            top: -1,
          }}
        >
          Mis Partes de Horas
        </h1>
        <div
          style={{
            marginLeft: "auto",
            fontSize: "0.9rem",
            color: "#007E87",
            backgroundColor: "#EAF7F9",
            padding: "4px 10px",
            borderRadius: 12,
            border: "1px solid #BFE9EC",
            fontWeight: 600,
          }}
          title="Total de partes de horas"
        >
          {headers?.length || 0} partes
        </div>
      </div>

      {/* Filtros */}
      <div className="timesheet-list-filters" ref={filtersRef}>
        <div className="filter-group">
          <label htmlFor="synced-filter">Enviado a BC:</label>
          <select
            id="synced-filter"
            value={filterSynced}
            onChange={(e) => setFilterSynced(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* Tabla de partes */}
      <div className="ts-responsive" ref={tableContainerRef}>
        {headers.length === 0 ? (
          <div className="no-data">
            <p>No hay partes de horas disponibles</p>
            <button
              onClick={() => navigate("/nuevo-parte")}
              className="ts-btn ts-btn--primary"
            >
              Crear Primer Parte
            </button>
          </div>
        ) : (
          <table className="ts-table">
            <thead>
              <tr>
                <th className="ts-th" style={{ width: 120, textAlign: "left" }}>Fecha</th>
                <th className="ts-th" style={{ textAlign: "left" }}>Descripción</th>
                <th className="ts-th" style={{ width: 100, textAlign: "left" }}>Período</th>
                <th className="ts-th" style={{ width: 110, textAlign: "left" }}>Estado</th>
                <th className="ts-th" style={{ width: 120, textAlign: "left" }}>Creado</th>
                <th className="ts-th" style={{ width: 110, textAlign: "left" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => (
                <tr key={header.id}>
                  <td className="ts-td" style={{ textAlign: "left" }}>{formatDate(header.posting_date)}</td>
                  <td className="ts-td ts-cell" style={{ textAlign: "left" }}>{header.posting_description || "Sin descripción"}</td>
                  <td className="ts-td" style={{ textAlign: "left" }}>{header.allocation_period}</td>
                  <td className="ts-td" style={{ textAlign: "left" }}>
                    <span className={`status-badge ${getStatusClass(header.status)}`}>
                      {getStatusText(header.status)}
                    </span>
                  </td>
                  <td className="ts-td" style={{ textAlign: "left" }}>{formatDate(header.created_at)}</td>
                  <td className="ts-td" style={{ textAlign: "left" }}>
                    <button
                      onClick={() => handleSelectTimesheet(header.id)}
                      className="ts-btn ts-btn--primary ts-btn--small"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sin botón de regreso: se usa BackToDashboard en el header */}
    </div>
  );
}

export default TimesheetListPage;
