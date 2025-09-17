import { useMsal } from "@azure/msal-react";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabaseClient } from "../supabaseClient";
import BackToDashboard from "./ui/BackToDashboard";
import TimesheetLines from "./TimesheetLines";

export default function RejectedLinesPage() {
  const { accounts } = useMsal();
  const navigate = useNavigate();

  const pageRef = useRef(null);
  const headerBarRef = useRef(null);
  const tableContainerRef = useRef(null);

  const recalcHeights = () => {
    try {
      if (!tableContainerRef.current) return;
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const tableRect = tableContainerRef.current.getBoundingClientRect();
      const top = tableRect.top;
      const available = Math.max(0, Math.floor(viewportH - top));
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
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  const userEmail = accounts?.[0]?.username || "";

  const { data: rejectedLines, isLoading, error } = useQuery({
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
      return data || [];
    },
  });

  const totalLines = rejectedLines?.length || 0;
  const totalHours = (rejectedLines || []).reduce(
    (sum, l) => sum + (Number(l.quantity) || 0),
    0
  );

  return (
    <div className="rejected-lines-page" ref={pageRef}>
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
          Líneas Rechazadas
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

      <div className="ts-responsive" ref={tableContainerRef}>
        {isLoading ? (
          <div className="loading-container">Cargando líneas rechazadas…</div>
        ) : error ? (
          <div className="error-container">
            <h2>Error</h2>
            <p>{String(error?.message || error)}</p>
            <button onClick={() => navigate(0)} className="ts-btn ts-btn--primary">
              Reintentar
            </button>
          </div>
        ) : totalLines === 0 ? (
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
            showResourceColumns={true}
          />
        )}
      </div>
    </div>
  );
}


