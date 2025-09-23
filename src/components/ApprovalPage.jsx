// src/components/ApprovalPage.jsx
import { useMsal } from "@azure/msal-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import "../styles/ApprovalPage.css";
import { supabaseClient } from "../supabaseClient";
import { formatDate } from "../utils/dateHelpers";
import TimesheetLines from "./TimesheetLines";
import BackToDashboard from "./ui/BackToDashboard";
import BcModal from "./ui/BcModal";

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

  // Estado para filtros con debounce (para evitar consultas excesivas)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Estado para selección de headers
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [autoSelectedHeadersDone, setAutoSelectedHeadersDone] = useState(false);

  // Estado para selección de líneas
  const [selectedLines, setSelectedLines] = useState([]);
  // Líneas excluidas manualmente aunque su cabecera esté seleccionada
  const [excludedLines, setExcludedLines] = useState([]);

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
    queryKey: ["approval-lines", selectedHeaders, debouncedFilters],
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
      if (debouncedFilters.resource) {
        query = query.eq("resource_no", debouncedFilters.resource);
      }
      if (debouncedFilters.period) {
        query = query.eq("resource_timesheet_header.allocation_period", debouncedFilters.period);
      }
      if (debouncedFilters.project) {
        query = query.eq("job_no", debouncedFilters.project);
      }
      if (debouncedFilters.task) {
        query = query.eq("job_task_no", debouncedFilters.task);
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
    staleTime: 2 * 60 * 1000, // 2 minutos - más tiempo para evitar refrescos
    refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
    refetchOnMount: false, // No refrescar al montar si ya hay datos
    refetchInterval: false, // No refrescar automáticamente
  });

  // Obtener recursos para filtro (solo los que tienen líneas pendientes de aprobación)
  const { data: resources } = useQuery({
    queryKey: ["resources", user?.username],
    queryFn: async () => {
      if (!user?.username) return [];

      // Obtener el resource_no del aprobador
      const userEmail = String(user.username).toLowerCase();
      const { data: resourceRow } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();

      if (!resourceRow?.code) return [];

      // Obtener solo recursos que tienen líneas pendientes donde el aprobador es responsable
      const { data, error } = await supabaseClient
        .from("timesheet")
        .select(`
          resource_timesheet_header!inner(
            resource_no,
            resource!inner(code, name)
          )
        `)
        .eq("status", "Pending")
        .eq("resource_responsible", resourceRow.code)
        .or("synced_to_bc.is.false,synced_to_bc.is.null");

      if (error) {
        console.error("❌ Error cargando recursos:", error);
        throw error;
      }

      // Extraer recursos únicos
      const uniqueResources = new Map();
      (data || []).forEach(line => {
        const resource = line.resource_timesheet_header?.resource;
        if (resource?.code && resource?.name) {
          uniqueResources.set(resource.code, {
            code: resource.code,
            name: resource.name
          });
        }
      });

      const result = Array.from(uniqueResources.values()).sort((a, b) => a.name.localeCompare(b.name));
      console.log("📊 Recursos con líneas pendientes:", result.length);
      return result;
    },
    enabled: !!user?.username,
    staleTime: 5 * 60 * 1000, // 5 minutos - recursos cambian poco
    refetchOnWindowFocus: false,
  });

  // Obtener proyectos para filtro (solo los que están en líneas pendientes de aprobación)
  const { data: projects } = useQuery({
    queryKey: ["projects", user?.username, selectedHeaders.length],
    queryFn: async () => {
      if (!user?.username) return [];

      // Obtener el resource_no del aprobador
      const userEmail = String(user.username).toLowerCase();
      const { data: resourceRow } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();

      if (!resourceRow?.code) return [];

      // Obtener solo proyectos que están en líneas pendientes donde el aprobador es responsable
      // Primero obtener job numbers de líneas pendientes
      const { data: simpleData, error: simpleError } = await supabaseClient
        .from("timesheet")
        .select("job_no")
        .eq("status", "Pending")
        .eq("resource_responsible", resourceRow.code)
        .not("job_no", "is", null)
        .limit(100);

      if (simpleError) {
        console.error("❌ Error en consulta simple:", simpleError);
        throw simpleError;
      }

      if (!simpleData || simpleData.length === 0) {
        return [];
      }

      // Obtener los proyectos únicos
      const jobNos = [...new Set(simpleData.map(line => line.job_no).filter(Boolean))];

      const { data, error } = await supabaseClient
        .from("job")
        .select("no, description")
        .in("no", jobNos)
        .order("description");

      if (error) {
        console.error("❌ Error cargando proyectos:", error);
        throw error;
      }

      const result = (data || []).map(job => ({
        no: job.no,
        description: job.description
      }));

      return result;
    },
    enabled: !!user?.username,
    staleTime: 10 * 60 * 1000, // 10 minutos - proyectos cambian poco en aprobación
    refetchOnWindowFocus: false,
    refetchOnMount: false, // No refrescar al montar si ya hay datos
  });

  // Obtener tareas para filtro (solo del proyecto seleccionado)
  const { data: tasks } = useQuery({
    queryKey: ["tasks", debouncedFilters.project],
    queryFn: async () => {
      if (!debouncedFilters.project) return [];

      // Obtener tareas solo del proyecto seleccionado
      const { data, error } = await supabaseClient
        .from("job_task")
        .select("no, description")
        .eq("job_no", debouncedFilters.project)
        .order("description");

      if (error) throw error;
      return data || [];
    },
    enabled: !!debouncedFilters.project,
    staleTime: 2 * 60 * 1000, // 2 minutos - tareas cambian poco
    refetchOnWindowFocus: false,
  });

  // Obtener períodos para filtro (solo de partes pendientes de aprobar)
  const { data: periods } = useQuery({
    queryKey: ["periods", user?.username],
    queryFn: async () => {
      if (!user?.username) return [];

      // Obtener el resource_no del aprobador
      const userEmail = String(user.username).toLowerCase();
      const { data: resourceRow } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();

      if (!resourceRow?.code) return [];

      // Obtener períodos únicos de líneas pendientes donde el aprobador es responsable
      const { data, error } = await supabaseClient
        .from("timesheet")
        .select(`
          resource_timesheet_header!inner(
            allocation_period
          )
        `)
        .eq("status", "Pending")
        .eq("resource_responsible", resourceRow.code)
        .or("synced_to_bc.is.false,synced_to_bc.is.null");

      if (error) {
        console.error("❌ Error cargando períodos:", error);
        throw error;
      }

      // Extraer períodos únicos
      const uniquePeriods = new Set();
      (data || []).forEach(line => {
        const period = line.resource_timesheet_header?.allocation_period;
        if (period) {
          uniquePeriods.add(period);
        }
      });

      const result = Array.from(uniquePeriods).sort();
      console.log("📊 Períodos con líneas pendientes:", result.length);
      return result;
    },
    enabled: !!user?.username,
    staleTime: 2 * 60 * 1000, // 2 minutos - períodos cambian poco
    refetchOnWindowFocus: false,
  });

  // Debounce para filtros (evita consultas excesivas)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms de delay - más tiempo para evitar refrescos invasivos

    return () => clearTimeout(timer);
  }, [filters]);

  // Limpiar filtro de tareas cuando cambie el proyecto
  useEffect(() => {
    if (filters.task && !filters.project) {
      setFilters(prev => ({ ...prev, task: "" }));
    }
  }, [filters.project, filters.task]);

  // Seleccionar todos los headers por defecto (solo una vez tras cargar datos)
  useEffect(() => {
    if (
      !autoSelectedHeadersDone &&
      Array.isArray(headersData) &&
      headersData.length > 0
    ) {
      setSelectedHeaders(headersData.map((h) => h.id));
      setAutoSelectedHeadersDone(true);
    }
  }, [headersData, autoSelectedHeadersDone]);

  // Manejar selección de headers
  const handleHeaderSelection = useCallback(
    (headerId, isSelected) => {
      setSelectedHeaders((prev) =>
        isSelected
          ? [...new Set([...prev, headerId])]
          : prev.filter((id) => id !== headerId)
      );

      // Al deseleccionar una cabecera, limpiar exclusiones de sus líneas
      if (!isSelected && Array.isArray(linesData)) {
        const headerLineIds = (linesData || [])
          .filter((l) => l.header_id === headerId)
          .map((l) => l.id);
        setExcludedLines((prev) =>
          prev.filter((id) => !headerLineIds.includes(id))
        );
      }
    },
    [linesData]
  );

  // Sincronizar selección de líneas cuando cambian headers seleccionados o llegan nuevas líneas
  useEffect(() => {
    if (!selectedHeaders || selectedHeaders.length === 0) {
      setSelectedLines([]);
      return;
    }
    const baseIds = (linesData || [])
      .filter((l) => selectedHeaders.includes(l.header_id))
      .map((l) => l.id);
    const ids = baseIds.filter((id) => !excludedLines.includes(id));
    setSelectedLines(ids);
  }, [selectedHeaders, linesData, excludedLines]);

  // Manejar selección de todas las líneas
  const handleSelectAllLines = useCallback(
    (selectAll) => {
      const baseIds = (linesData || [])
        .filter((l) => selectedHeaders.includes(l.header_id))
        .map((l) => l.id);
      if (selectAll) {
        setExcludedLines([]);
        setSelectedLines(baseIds);
      } else {
        setExcludedLines(baseIds);
        setSelectedLines([]);
      }
    },
    [linesData, selectedHeaders]
  );

  // Manejar selección de líneas recibiendo el array completo desde el hijo
  const handleLineSelection = useCallback(
    (lineIdOrArray, isSelected) => {
      // Si el hijo envía el array completo (TimesheetLines onLineSelectionChange), sincronizamos directamente
      if (Array.isArray(lineIdOrArray)) {
        const newSelection = lineIdOrArray;
        const baseIds = (linesData || [])
          .filter((l) => selectedHeaders.includes(l.header_id))
          .map((l) => l.id);
        const newExcluded = baseIds.filter((id) => !newSelection.includes(id));
        setExcludedLines(newExcluded);
        setSelectedLines(newSelection);
        return;
      }

      // Modo compatibilidad: (lineId, isSelected)
      const lineId = lineIdOrArray;
      if (isSelected) {
        setExcludedLines((prev) => prev.filter((id) => id !== lineId));
        setSelectedLines((prev) =>
          prev.includes(lineId) ? prev : [...prev, lineId]
        );
      } else {
        setExcludedLines((prev) =>
          prev.includes(lineId) ? prev : [...prev, lineId]
        );
        setSelectedLines((prev) => prev.filter((id) => id !== lineId));
      }
    },
    [linesData, selectedHeaders]
  );

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
      toast.success(`✅ ${selectedLines.length} líneas aprobadas correctamente`);
    } catch (error) {
      console.error("Error aprobando líneas:", error);
      toast.error("❌ Error al aprobar líneas");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLines, queryClient]);

  // Modal de rechazo
  const [rejectModal, setRejectModal] = useState({ open: false, reason: "" });

  const openRejectModal = useCallback(() => {
    if (selectedLines.length === 0) return;
    setRejectModal({ open: true, reason: "" });
  }, [selectedLines.length]);

  const confirmReject = useCallback(async () => {
    if (selectedLines.length === 0) return;
    const reason = (rejectModal.reason || "").trim();
    if (!reason) return; // no confirmar sin motivo

    setIsProcessing(true);
    try {
      const { error } = await supabaseClient
        .from("timesheet")
        .update({ status: "Rejected", rejection_cause: reason })
        .in("id", selectedLines);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["approval-headers"] });
      queryClient.invalidateQueries({ queryKey: ["approval-lines"] });
      queryClient.invalidateQueries({ queryKey: ["lines"] });
      setSelectedLines([]);
      setRejectModal({ open: false, reason: "" });
    } catch (error) {
      console.error("Error rechazando líneas:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLines, rejectModal.reason, queryClient]);

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
        <div className="approval-header-left">
          <BackToDashboard title="Volver al Dashboard" compact={true} />
          <h1>Aprobación de Horas</h1>
        </div>
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
            {periods?.map((period, index) => (
              <option key={`period-${index}-${period}`} value={period}>
                {period}
              </option>
            ))}
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

        <div className="filter-actions">
          <button
            className="ts-btn ts-btn--secondary ts-btn--small"
            onClick={() => {
              setFilters({
                resource: "",
                period: "",
                project: "",
                task: "",
              });
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Grilla de Headers (tabla) */}
      <div className="approval-headers">
        <h2>📋 Recursos con Líneas Pendientes</h2>
        <div className="ts-responsive">
          <table className="ts-table">
            <thead>
              <tr>
                <th className="ts-th" style={{ width: "40px", textAlign: "center" }}>
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
                <th className="ts-th" style={{ textAlign: "center" }}>
                  Recurso
                </th>
                <th className="ts-th" style={{ textAlign: "center" }}>
                  Período
                </th>
                <th
                  className="ts-th"
                  style={{ textAlign: "center", width: "140px" }}
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
            <input
              type="checkbox"
              aria-label="Seleccionar todas las líneas visibles"
              checked={selectedLinesCount === totalLines && totalLines > 0}
              onChange={(e) => handleSelectAllLines(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span className="selected-count">
              {selectedLinesCount} de {totalLines} seleccionadas
            </span>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
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
                onClick={openRejectModal}
                disabled={selectedLinesCount === 0 || isProcessing}
              >
                {isProcessing
                  ? "Procesando..."
                  : `❌ Rechazar Selección (${selectedLinesCount})`}
              </button>
            </div>
          </div>
        </div>

        {linesLoading ? (
          <div className="lines-loading">Cargando líneas...</div>
        ) : (
          <TimesheetLines
            lines={linesData || []}
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
            showResourceColumns={true}
          />
        )}
      </div>

      {/* Botones de Acción movidos a la cabecera de líneas */}

      {/* Modal de rechazo */}
      <BcModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, reason: "" })}
        title="Motivo del rechazo"
        confirmText="Rechazar"
        cancelText="Cancelar"
        confirmButtonType="danger"
        onConfirm={confirmReject}
        onCancel={() => setRejectModal({ open: false, reason: "" })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="reject-reason" style={{ fontWeight: 600, color: "#333" }}>
            Indica el motivo del rechazo
          </label>
          <input
            id="reject-reason"
            type="text"
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
            className="ts-input"
            placeholder="Motivo..."
            autoFocus
          />
        </div>
      </BcModal>
    </div>
  );
}
