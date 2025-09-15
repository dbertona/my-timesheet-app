// src/components/ApprovalPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMsal } from "@azure/msal-react";
import { supabaseClient } from "../supabaseClient";
import TimesheetLines from "./TimesheetLines";
import "../styles/ApprovalPage.css";
import { formatDate } from "../utils/dateHelpers";

export default function ApprovalPage() {
  const queryClient = useQueryClient();
  const { instance, accounts } = useMsal();

  // Estado para filtros
  const [filters, setFilters] = useState({
    resource: "",
    period: "",
    project: "",
    task: "",
  });

  // Estado para selección de headers
  const [selectedHeaders, setSelectedHeaders] = useState([]);

  // Estado para selección de líneas
  const [selectedLines, setSelectedLines] = useState([]);

  // Estado para loading
  const [isProcessing, setIsProcessing] = useState(false);

  // Obtener usuario actual usando MSAL como en HomeDashboard
  const user = useMemo(() => {
    try {
      const activeAccount = instance.getActiveAccount() || accounts[0];
      console.log("👤 Usuario MSAL:", activeAccount);
      return activeAccount;
    } catch (error) {
      console.error("❌ Error obteniendo usuario MSAL:", error);
      return null;
    }
  }, [instance, accounts]);

  // Log del estado del usuario
  console.log("🔍 Estado del usuario:", { user });

  // Obtener headers con líneas pendientes donde el usuario es aprobador
  const {
    data: headersData,
    isLoading: headersLoading,
    error: headersError,
  } = useQuery({
    queryKey: ["approval-headers", user?.username, filters],
    queryFn: async () => {
      console.log("🚀 Iniciando consulta de headers...");
      console.log("👤 Usuario:", user);

      if (!user?.username) {
        console.log("❌ No hay usuario logueado");
        return [];
      }

      const userEmail = String(user.username).toLowerCase();
      console.log("🔍 Buscando headers para aprobador (email):", userEmail);

      // 1) Obtener código del recurso del aprobador
      const { data: resourceRow, error: resourceErr } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();

      if (resourceErr || !resourceRow?.code) {
        console.log(
          "❌ No se encontró resource.code para:",
          userEmail,
          resourceErr
        );
        return [];
      }

      const approverResourceNo = resourceRow.code;
      console.log("🔍 Aprobador resource_no:", approverResourceNo);

      // 2) Traer líneas Pending donde el aprobador es responsable
      const { data: pendingLines, error: pendingErr } = await supabaseClient
        .from("timesheet")
        .select(
          `
          id,
          header_id,
          status,
          resource_timesheet_header!inner(
            id,
            resource_no,
            allocation_period
          )
        `
        )
        .eq("status", "Pending")
        .eq("resource_responsible", approverResourceNo)
        .or("synced_to_bc.is.false,synced_to_bc.is.null");

      if (pendingErr) {
        console.error("❌ Error cargando líneas pendientes:", pendingErr);
        throw pendingErr;
      }

      console.log("📊 Líneas Pending encontradas:", pendingLines?.length || 0);

      // 3) Agrupar por header y contar
      const headersMap = new Map();
      (pendingLines || []).forEach((line) => {
        const header = line.resource_timesheet_header;
        if (!header) return;
        if (!headersMap.has(header.id)) {
          headersMap.set(header.id, {
            id: header.id,
            resource_no: header.resource_no,
            allocation_period: header.allocation_period,
            pendingCount: 0,
          });
        }
        headersMap.get(header.id).pendingCount += 1;
      });

      const result = Array.from(headersMap.values());
      console.log("✅ Headers finales:", result);
      return result;
    },
    enabled: !!user?.username,
  });

  // Log de errores de headers
  if (headersError) {
    console.error("❌ Error en consulta de headers:", headersError);
  }

  // Logs de estado
  console.log("📊 Estado de la consulta:", {
    headersLoading,
    headersError,
    headersData: headersData?.length || 0,
    enabled: !!user?.username,
  });

  // Obtener líneas pendientes filtradas por headers seleccionados
  const { data: linesData, isLoading: linesLoading } = useQuery({
    queryKey: ["approval-lines", selectedHeaders, filters],
    queryFn: async () => {
      if (selectedHeaders.length === 0) return [];

      // Resolver nuevamente el resource_no del aprobador para filtrar el detalle
      const userEmail = String(user?.username || "").toLowerCase();
      let approverResourceNo = null;
      if (userEmail) {
        const { data: resRow } = await supabaseClient
          .from("resource")
          .select("code")
          .eq("email", userEmail)
          .single();
        approverResourceNo = resRow?.code || null;
      }

      let query = supabaseClient
        .from("timesheet")
        .select(
          `
          id,
          header_id,
          status,
          job_no,
          job_task_no,
          description,
          work_type,
          quantity,
          date,
          department_code,
          resource_no,
          resource_name,
          resource_timesheet_header!inner(
            id,
            resource_no,
            allocation_period
          )
        `
        )
        .in("header_id", selectedHeaders)
        .eq("status", "Pending")
        .or("synced_to_bc.is.false,synced_to_bc.is.null");

      if (approverResourceNo) {
        query = query.eq("resource_responsible", approverResourceNo);
      }

      // Aplicar filtros adicionales
      if (filters.project) {
        query = query.eq("job_no", filters.project);
      }
      if (filters.task) {
        query = query.eq("job_task_no", filters.task);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Enriquecer con descripciones de proyecto en un solo batch
      const lines = data || [];
      const missingDescJobNos = Array.from(
        new Set(
          lines
            .filter((l) => l.job_no && !l.job_no_description)
            .map((l) => l.job_no)
        )
      );

      let jobDescMap = {};
      if (missingDescJobNos.length > 0) {
        try {
          const { data: jobsRes } = await supabaseClient
            .from("job")
            .select("no, description")
            .in("no", missingDescJobNos);
          jobDescMap = Object.fromEntries(
            (jobsRes || []).map((j) => [j.no, j.description || ""])
          );
        } catch {
          jobDescMap = {};
        }
      }

      return lines.map((l) => ({
        ...l,
        job_no_description: l.job_no_description || jobDescMap[l.job_no] || "",
      }));
    },
    enabled: selectedHeaders.length > 0,
  });

  // Obtener recursos para filtro
  const { data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("resource")
        .select("code, name")
        .order("name");
      if (error) {
        console.error("❌ Error cargando recursos:", error);
        throw error;
      }
      console.log("📊 Recursos cargados:", data?.length || 0);
      return data || [];
    },
  });

  // Obtener proyectos para filtro
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("job")
        .select("no, description")
        .order("description");
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener tareas para filtro
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("job_task")
        .select("no, description")
        .order("description");
      if (error) throw error;
      return data || [];
    },
  });

  // Seleccionar todos los headers por defecto
  useEffect(() => {
    if (headersData && selectedHeaders.length === 0) {
      setSelectedHeaders(headersData.map((h) => h.id));
    }
  }, [headersData, selectedHeaders.length]);

  // Manejar selección de headers
  const handleHeaderSelection = useCallback((headerId, isSelected) => {
    setSelectedHeaders((prev) =>
      isSelected ? [...prev, headerId] : prev.filter((id) => id !== headerId)
    );
    // Limpiar selección de líneas cuando cambian los headers
    setSelectedLines([]);
  }, []);

  // Manejar selección de todas las líneas
  const handleSelectAllLines = useCallback(
    (selectAll) => {
      setSelectedLines(
        selectAll ? (linesData || []).map((line) => line.id) : []
      );
    },
    [linesData]
  );

  // Manejar selección individual de líneas
  const handleLineSelection = useCallback((lineId, isSelected) => {
    setSelectedLines((prev) =>
      isSelected ? [...prev, lineId] : prev.filter((id) => id !== lineId)
    );
  }, []);

  // Aprobar líneas seleccionadas
  const handleApproveSelection = useCallback(async () => {
    if (selectedLines.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabaseClient
        .from("timesheet")
        .update({ status: "Approved" })
        .in("id", selectedLines);

      if (error) throw error;

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["approval-headers"] });
      queryClient.invalidateQueries({ queryKey: ["approval-lines"] });
      queryClient.invalidateQueries({ queryKey: ["lines"] });

      setSelectedLines([]);
      alert(`✅ ${selectedLines.length} líneas aprobadas correctamente`);
    } catch (error) {
      console.error("Error aprobando líneas:", error);
      alert("❌ Error al aprobar líneas");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLines, queryClient]);

  // Rechazar líneas seleccionadas
  const handleRejectSelection = useCallback(async () => {
    if (selectedLines.length === 0) return;

    const reason = prompt("Motivo del rechazo:");
    if (!reason) return;

    setIsProcessing(true);
    try {
      const { error } = await supabaseClient
        .from("timesheet")
        .update({
          status: "Rejected",
          rejection_cause: reason,
        })
        .in("id", selectedLines);

      if (error) throw error;

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["approval-headers"] });
      queryClient.invalidateQueries({ queryKey: ["approval-lines"] });
      queryClient.invalidateQueries({ queryKey: ["lines"] });

      setSelectedLines([]);
      alert(`❌ ${selectedLines.length} líneas rechazadas correctamente`);
    } catch (error) {
      console.error("Error rechazando líneas:", error);
      alert("❌ Error al rechazar líneas");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLines, queryClient]);

  // Calcular totales
  const totalHeaders = headersData?.length || 0;
  const totalLines = linesData?.length || 0;
  const selectedLinesCount = selectedLines.length;

  if (headersLoading) {
    return (
      <div className="approval-loading">Cargando datos de aprobación...</div>
    );
  }

  return (
    <div className="approval-page">
      <div className="approval-header">
        <h1>📋 Aprobación de Horas</h1>
        <div className="approval-summary">
          📊 {totalHeaders} recursos con {totalLines} líneas pendientes
        </div>
      </div>

      {/* Filtros */}
      <div className="approval-filters">
        <div className="filter-group">
          <label>Recurso:</label>
          <select
            value={filters.resource}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, resource: e.target.value }))
            }
          >
            <option value="">Todos</option>
            {resources?.map((resource, index) => (
              <option
                key={`resource-${index}-${resource.code}`}
                value={resource.code}
              >
                {resource.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Período:</label>
          <select
            value={filters.period}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, period: e.target.value }))
            }
          >
            <option value="">Todos</option>
            {/* TODO: Obtener períodos disponibles */}
          </select>
        </div>

        <div className="filter-group">
          <label>Proyecto:</label>
          <select
            value={filters.project}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, project: e.target.value }))
            }
          >
            <option value="">Todos</option>
            {projects?.map((project, index) => (
              <option key={`project-${index}-${project.no}`} value={project.no}>
                {project.description}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Tarea:</label>
          <select
            value={filters.task}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, task: e.target.value }))
            }
          >
            <option value="">Todas</option>
            {tasks?.map((task, index) => (
              <option key={`task-${index}-${task.no}`} value={task.no}>
                {task.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grilla de Headers (tabla) */}
      <div className="approval-headers">
        <h2>📋 Recursos con Líneas Pendientes</h2>
        <div className="ts-responsive">
          <table className="ts-table">
            <thead>
              <tr>
                <th className="ts-th" style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={
                      headersData?.length > 0 &&
                      selectedHeaders.length === headersData.length
                    }
                    onChange={(e) => {
                      const all = e.target.checked;
                      setSelectedHeaders(
                        all ? headersData.map((h) => h.id) : []
                      );
                      setSelectedLines([]);
                    }}
                  />
                </th>
                <th className="ts-th" style={{ textAlign: "left" }}>
                  Recurso
                </th>
                <th className="ts-th" style={{ textAlign: "left" }}>
                  Período
                </th>
                <th
                  className="ts-th"
                  style={{ textAlign: "right", width: "140px" }}
                >
                  Líneas pendientes
                </th>
              </tr>
            </thead>
            <tbody>
              {(headersData || []).map((h) => {
                const res = (resources || []).find(
                  (x) => x.code === h.resource_no
                );
                return (
                  <tr key={h.id}>
                    <td className="ts-td" style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedHeaders.includes(h.id)}
                        onChange={(e) =>
                          handleHeaderSelection(h.id, e.target.checked)
                        }
                      />
                    </td>
                    <td
                      className="ts-td ts-cell"
                      style={{ textAlign: "left", cursor: "pointer" }}
                      onClick={() =>
                        handleHeaderSelection(
                          h.id,
                          !selectedHeaders.includes(h.id)
                        )
                      }
                      title={res?.name || h.resource_no}
                    >
                      <div className="ts-cell">
                        {res?.name || h.resource_no}
                      </div>
                    </td>
                    <td className="ts-td" style={{ textAlign: "left" }}>
                      {h.allocation_period}
                    </td>
                    <td className="ts-td" style={{ textAlign: "right" }}>
                      {h.pendingCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Líneas Pendientes */}
      <div className="approval-lines">
        <div className="lines-header">
          <h2>📝 Líneas Pendientes ({totalLines})</h2>
          <div className="lines-actions">
            <label>
              <input
                type="checkbox"
                checked={selectedLinesCount === totalLines && totalLines > 0}
                onChange={(e) => handleSelectAllLines(e.target.checked)}
              />
              Seleccionar todo
            </label>
            <span className="selected-count">
              {selectedLinesCount} de {totalLines} seleccionadas
            </span>
          </div>
        </div>

        {linesLoading ? (
          <div className="lines-loading">Cargando líneas...</div>
        ) : (
          <TimesheetLines
            lines={(linesData || []).map((l) => ({
              ...l,
              isFactorialLine: true,
            }))}
            selectedLines={selectedLines}
            onLineSelectionChange={handleLineSelection}
            // Pasar props necesarias para que funcione
            editFormData={(() => {
              const map = {};
              (linesData || []).forEach((l) => {
                const d = l.date ? new Date(l.date) : null;
                map[l.id] = {
                  job_no: l.job_no || "",
                  job_no_description: l.job_no_description || "",
                  job_task_no: l.job_task_no || "",
                  description: l.description || "",
                  work_type: l.work_type || "",
                  quantity: l.quantity ?? "",
                  department_code: l.department_code || "",
                  date: d && !isNaN(d.getTime()) ? formatDate(d) : "",
                };
              });
              return map;
            })()}
            errors={{}}
            inputRefs={{ current: {} }}
            hasRefs={false}
            setSafeRef={() => {}}
            header={null}
            editableHeader={null}
            periodChangeTrigger={0}
            serverDate={new Date()}
            calendarHolidays={[]}
            scheduleAutosave={() => {}}
            saveLineNow={() => {}}
            savingByLine={false}
            onLinesChange={() => {}}
            setLines={() => {}}
            effectiveHeaderId={null}
            sortLines={null}
            onLineDelete={() => {}}
            onLineAdd={() => {}}
            markAsChanged={() => {}}
            addEmptyLine={() => {}}
            handleKeyDown={() => {}}
            handleInputChange={() => {}}
            onDuplicateLines={() => {}}
            onDeleteLines={() => {}}
            showResponsible={false}
          />
        )}
      </div>

      {/* Botones de Acción */}
      <div className="approval-actions">
        <button
          className="ts-btn ts-btn--primary"
          onClick={handleApproveSelection}
          disabled={selectedLinesCount === 0 || isProcessing}
        >
          {isProcessing
            ? "Procesando..."
            : `✅ Aprobar Selección (${selectedLinesCount})`}
        </button>
        <button
          className="ts-btn ts-btn--danger"
          onClick={handleRejectSelection}
          disabled={selectedLinesCount === 0 || isProcessing}
        >
          {isProcessing
            ? "Procesando..."
            : `❌ Rechazar Selección (${selectedLinesCount})`}
        </button>
      </div>
    </div>
  );
}
