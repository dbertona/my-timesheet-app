import { useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import React, {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../supabaseClient";
import TimesheetLines from "./TimesheetLines";
import BackToDashboard from "./ui/BackToDashboard";

export default function RejectedLinesPage() {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Lógica de cálculo de altura replicada de TimesheetEdit
  useLayoutEffect(() => {
    const calculateAndSetHeight = () => {
      const tableContainer = tableContainerRef.current;
      if (tableContainer) {
        const viewportHeight = window.innerHeight;
        const tableTopPosition = tableContainer.getBoundingClientRect().top;
        const bottomMargin = 20; // Margen inferior

        const availableHeight =
          viewportHeight - tableTopPosition - bottomMargin;

        tableContainer.style.height = `${availableHeight}px`;
        tableContainer.style.overflow = "auto";
      }
    };

    calculateAndSetHeight();
    window.addEventListener("resize", calculateAndSetHeight);
    const resizeObserver = new ResizeObserver(calculateAndSetHeight);
    const currentPageRef = pageRef.current; // Capturar la referencia actual

    if (currentPageRef) {
      resizeObserver.observe(currentPageRef);
    }

    return () => {
      window.removeEventListener("resize", calculateAndSetHeight);
      if (currentPageRef) {
        resizeObserver.unobserve(currentPageRef);
      }
    };
  }, []);

  const userEmail = accounts?.[0]?.username || "";

  // Filtros locales (patrón similar a otras páginas)
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterProject, setFilterProject] = useState("");

  // Resolver resource_no del usuario actual para filtros dependientes
  const { data: resourceCode } = useQuery({
    queryKey: ["resource-code", userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const { data, error } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();
      if (error) return null;
      return data?.code || null;
    },
  });

  // Proyectos para select: solo donde el recurso sea miembro (tabla job_team)
  const { data: projects } = useQuery({
    queryKey: ["projects-by-member", resourceCode],
    queryFn: async () => {
      if (!resourceCode) return [];
      // 1) job_team → recoger job_no del miembro
      const { data: jtRows, error: jtErr } = await supabaseClient
        .from("job_team")
        .select("job_no")
        .eq("resource_no", resourceCode);
      if (jtErr) throw jtErr;
      const jobNos = Array.from(new Set((jtRows || []).map((r) => r.job_no))).filter(Boolean);
      if (jobNos.length === 0) return [];
      // 2) job → traer descripciones
      const { data: jobs, error: jobsErr } = await supabaseClient
        .from("job")
        .select("no, description")
        .in("no", jobNos)
        .order("description");
      if (jobsErr) throw jobsErr;
      return jobs || [];
    },
    enabled: !!resourceCode,
    staleTime: 5 * 60 * 1000,
  });

  const { data: rejectedLinesRaw, isLoading, error } = useQuery({
    queryKey: ["rejected-lines", userEmail],
    queryFn: async () => {
      if (!userEmail) return [];

      // 1) Resolver recurso del usuario
      const { data: resourceRow, error: resourceErr } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .single();
      if (resourceErr || !resourceRow?.code) return [];

      // 2) Traer TODAS las líneas Rejected no sincronizadas, del responsable
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
        .eq("status", "Rejected")
        .eq("resource_responsible", resourceRow.code)
        .or("synced_to_bc.is.null,synced_to_bc.eq.false");

      const { data, error } = await query;
      if (error) throw error;
      const lines = data || [];

      // Enriquecer con descripciones de proyecto como en ApprovalPage
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
  });

  // Derivar períodos disponibles y aplicar filtros en cliente
  const periods = useMemo(() => {
    const set = new Set(
      (rejectedLinesRaw || []).map(
        (l) => l?.resource_timesheet_header?.allocation_period
      )
    );
    return Array.from(set).filter(Boolean).sort().reverse();
  }, [rejectedLinesRaw]);

  const rejectedLines = useMemo(() => {
    let list = Array.isArray(rejectedLinesRaw) ? rejectedLinesRaw : [];
    if (filterPeriod) {
      list = list.filter(
        (l) => l?.resource_timesheet_header?.allocation_period === filterPeriod
      );
    }
    if (filterProject) {
      list = list.filter((l) => String(l.job_no || "") === filterProject);
    }
    return list;
  }, [rejectedLinesRaw, filterPeriod, filterProject]);

  const totalLines = rejectedLines?.length || 0;
  const totalHours = (rejectedLines || []).reduce(
    (sum, l) => sum + (Number(l.quantity) || 0),
    0
  );

  return (
    <div
      className="rejected-lines-page"
      ref={pageRef}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        className="ts-header-bar"
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
          Horas Rechazadas
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
          title="Horas • Líneas"
        >
          {Math.round(totalHours)} Horas • {totalLines} líneas
        </div>
      </div>

      {/* Filtros en bloque como otras páginas */}
      <div
        className="timesheet-list-filters"
        style={{ flexShrink: 0 }}
      >
        <div className="filter-group">
          <label htmlFor="filter-period">Período:</label>
          <select
            id="filter-period"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-project">Proyecto:</label>
          <select
            id="filter-project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos</option>
            {(projects || []).map((p) => (
              <option key={p.no} value={p.no}>
                {p.description}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
          <button
            className="ts-btn ts-btn--secondary ts-btn--small"
            onClick={() => {
              setFilterPeriod("");
              setFilterProject("");
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div
        className="ts-responsive"
        ref={tableContainerRef}
        style={{ flex: 1, minHeight: 0 }}
      >
        {isLoading && <p>Cargando líneas rechazadas...</p>}
        {error && (
          <div className="error-container">
            <h2>Error</h2>
            <p>{String(error?.message || error)}</p>
            <button onClick={() => navigate(0)} className="ts-btn ts-btn--primary">
              Reintentar
            </button>
          </div>
        )}
        {totalLines === 0 ? (
          <div className="no-data">
            <p>No hay líneas rechazadas</p>
          </div>
        ) : (
          <TimesheetLines
            lines={rejectedLines}
            selectedLines={[]}
            onLineSelectionChange={() => {}}
            editFormData={(() => {
              const map = {};
              (rejectedLines || []).forEach((l) => {
                const d = l.date ? new Date(l.date) : null;
                const fmt = (date) => {
                  try {
                    return date && !isNaN(date.getTime())
                      ? `${String(date.getDate()).padStart(2, "0")}/${String(
                          date.getMonth() + 1
                        ).padStart(2, "0")}/${date.getFullYear()}`
                      : "";
                  } catch {
                    return "";
                  }
                };
                map[l.id] = {
                  job_no: l.job_no || "",
                  job_no_description: l.job_no_description || "",
                  job_task_no: l.job_task_no || "",
                  description: l.description || "",
                  work_type: l.work_type || "",
                  quantity: l.quantity ?? "",
                  department_code: l.department_code || "",
                  date: fmt(d),
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
            showResourceColumns={false}
            extraColumns={[
              {
                key: "allocation_period",
                label: "Período",
                width: 110,
                align: "left",
                renderCell: (l) => (
                  <div className="ts-readonly">
                    {l?.resource_timesheet_header?.allocation_period || ""}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}


