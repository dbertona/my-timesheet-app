import { useMsal } from "@azure/msal-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useColumnResize from "../hooks/useColumnResize";
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

  // Configuración de columnas para redimensionamiento
  const columns = [
    "posting_date",
    "posting_description",
    "allocation_period",
    "synced_to_bc",
    "created_at",
    "actions"
  ];

  // Límites por columna y defaults (UX consistente)
  const colInitial = {
    posting_date: 120,
    posting_description: 320,
    allocation_period: 120,
    synced_to_bc: 90,
    created_at: 120,
    actions: 120,
  };
  const colMin = {
    posting_date: 100,
    posting_description: 220,
    allocation_period: 100,
    synced_to_bc: 80,
    created_at: 100,
    actions: 110,
  };
  const colMax = {
    posting_date: 160,
    posting_description: 560,
    allocation_period: 160,
    synced_to_bc: 120,
    created_at: 160,
    actions: 140,
  };
  const fixedCols = new Set(["synced_to_bc", "actions", "posting_date", "created_at"]);

  // Hook para redimensionamiento de columnas con límites y clamp por contenedor
  const storageKey = `timesheet-list-columns:${userEmail || 'anon'}`;
  const { colStyles, onMouseDown, setWidths } = useColumnResize(
    columns,
    storageKey,
    80,
    {
      initialWidths: colInitial,
      perColumnMin: colMin,
      perColumnMax: colMax,
      getContainerWidth: () => tableContainerRef.current?.clientWidth,
      disableResizeFor: Array.from(fixedCols),
    }
  );

  // Función para medir texto (igual que TimesheetLines)
  const measureWithSpan = (element, text) => {
    const span = document.createElement("span");
    span.style.cssText = window.getComputedStyle(element).cssText;
    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "nowrap";
    span.textContent = text || "";

    document.body.appendChild(span);
    const width = Math.ceil(span.getBoundingClientRect().width);
    document.body.removeChild(span);
    return width;
  };

  // Función para auto-ajustar columnas (igual que TimesheetLines)
  const handleAutoFit = (colKey) => {
    const table = tableRef.current;
    if (!table) return;

    const colIndex = columns.indexOf(colKey);
    if (colIndex === -1) return;

    let maxContent = 0;

    const th = table.querySelector(`thead tr th:nth-child(${colIndex + 1})`);
    const thText = th ? th.childNodes[0]?.textContent?.trim() || "" : "";
    maxContent = Math.max(maxContent, measureWithSpan(th, thText));

    const tds = table.querySelectorAll(
      `tbody tr td:nth-child(${colIndex + 1})`
    );
    tds.forEach((td) => {
      const txt = td.textContent?.trim() || "";
      maxContent = Math.max(maxContent, measureWithSpan(td, txt));
    });

    const EXTRA = 6;
    const min = colMin[colKey] ?? 80; // Ancho mínimo por defecto
    const max = colMax[colKey] ?? 400; // Ancho máximo por defecto

    const finalWidth = Math.max(min, Math.min(max, maxContent + EXTRA));
    setWidths((prev) => ({ ...prev, [colKey]: finalWidth }));
  };

  // Refs para responsive (igual patrón que edición/aprobación)
  const pageRef = useRef(null);
  const headerBarRef = useRef(null);
  const filtersRef = useRef(null);
  const tableContainerRef = useRef(null); // .ts-responsive
  const tableRef = useRef(null); // Para redimensionamiento

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
      tableContainerRef.current.style.overflowX = "hidden";
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
          setError("Error cargando los partes de horas");
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

  // Obtener switch visual del estado de sincronización con BC
  const getSyncedSwitch = (syncedToBc) => {
    const isSynced = syncedToBc === true || String(syncedToBc) === "true" || String(syncedToBc) === "t";
    return (
      <div className={`bc-switch ${isSynced ? 'bc-switch--on' : 'bc-switch--off'}`}>
        <div className="bc-switch__slider"></div>
      </div>
    );
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
        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="ts-btn ts-btn--secondary ts-btn--small"
            onClick={() => {
              // Reset a defaults y limpiar preferencia del usuario
              setWidths({
                posting_date: 120,
                posting_description: 320,
                allocation_period: 120,
                synced_to_bc: 90,
                created_at: 120,
                actions: 120,
              });
              try {
                localStorage.removeItem(storageKey);
              } catch {
                /* noop */
              }
            }}
            title="Restablecer diseño de columnas"
          >
            Reset layout
          </button>
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
          <table className="ts-table" ref={tableRef}>
            <thead>
              <tr>
                <th className="ts-th" style={{ ...colStyles.posting_date, textAlign: "center" }}>
                  Fecha
                  {!fixedCols.has("posting_date") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "posting_date")}
                      onDoubleClick={() => handleAutoFit("posting_date")}
                      aria-hidden
                    />
                  )}
                </th>
                <th className="ts-th" style={{ ...colStyles.posting_description, textAlign: "center" }}>
                  Descripción
                  {!fixedCols.has("posting_description") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "posting_description")}
                      onDoubleClick={() => handleAutoFit("posting_description")}
                      aria-hidden
                    />
                  )}
                </th>
                <th className="ts-th" style={{ ...colStyles.allocation_period, textAlign: "center" }}>
                  Período
                  {!fixedCols.has("allocation_period") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "allocation_period")}
                      onDoubleClick={() => handleAutoFit("allocation_period")}
                      aria-hidden
                    />
                  )}
                </th>
                <th className="ts-th" style={{ ...colStyles.synced_to_bc, textAlign: "center" }}>
                  En BC
                  {!fixedCols.has("synced_to_bc") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "synced_to_bc")}
                      onDoubleClick={() => handleAutoFit("synced_to_bc")}
                      aria-hidden
                    />
                  )}
                </th>
                <th className="ts-th" style={{ ...colStyles.created_at, textAlign: "center" }}>
                  Creado
                  {!fixedCols.has("created_at") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "created_at")}
                      onDoubleClick={() => handleAutoFit("created_at")}
                      aria-hidden
                    />
                  )}
                </th>
                <th className="ts-th" style={{ ...colStyles.actions, textAlign: "center" }}>
                  Acciones
                  {!fixedCols.has("actions") && (
                    <span
                      className="ts-resizer"
                      onMouseDown={(e) => onMouseDown(e, "actions")}
                      onDoubleClick={() => handleAutoFit("actions")}
                      aria-hidden
                    />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => (
                <tr key={header.id}>
                  <td className="ts-td" style={{ ...colStyles.posting_date, textAlign: "left" }}>{formatDate(header.posting_date)}</td>
                  <td className="ts-td ts-cell" style={{ ...colStyles.posting_description, textAlign: "left" }}>{header.posting_description || "Sin descripción"}</td>
                  <td className="ts-td" style={{ ...colStyles.allocation_period, textAlign: "left" }}>{header.allocation_period}</td>
                  <td className="ts-td" style={{ ...colStyles.synced_to_bc, textAlign: "center" }}>
                    {getSyncedSwitch(header.synced_to_bc)}
                  </td>
                  <td className="ts-td" style={{ ...colStyles.created_at, textAlign: "left" }}>{formatDate(header.created_at)}</td>
                  <td className="ts-td" style={{ ...colStyles.actions, textAlign: "center" }}>
                    {(() => {
                      // Mostrar "Ver" solo si está sincronado (true/'true'/'t')
                      const isSynced = header.synced_to_bc === true || String(header.synced_to_bc) === "true" || String(header.synced_to_bc) === "t";
                      if (isSynced) {
                        return (
                          <button
                            onClick={() => navigate(`/edit/${header.id}`, { state: { readOnly: true } })}
                            className="ts-btn ts-btn--secondary ts-btn--small"
                          >
                            Ver
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => handleSelectTimesheet(header.id)}
                          className="ts-btn ts-btn--primary ts-btn--small"
                        >
                          Editar
                        </button>
                      );
                    })()}
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
