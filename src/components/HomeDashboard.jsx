// cspell:ignore msal useMsal
/* global __APP_VERSION__ */
import { useMsal } from "@azure/msal-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { generateAllocationPeriod, getServerDate } from "../api/date";
import "../styles/HomeDashboard.css";
import { supabaseClient } from "../supabaseClient";
import BcModal from "./ui/BcModal";

// Helper utilities removidos por no uso para cumplir lint

const HomeDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingEmail, setMissingEmail] = useState("");
  const [serverDate, setServerDate] = useState(null);
  const [allocationPeriod, setAllocationPeriod] = useState(null);

  // 🆕 Estados para partes de trabajo rechazados
  const [rejectedLinesCount, setRejectedLinesCount] = useState(0);
  const [rejectedHeadersCount, setRejectedHeadersCount] = useState(0);
  const [_loadingRejected, _setLoadingRejected] = useState(true);
  const [_errorRejected, _setErrorRejected] = useState(null);

  // 🆕 Estados para partes de trabajo pendientes de aprobar
  const [pendingLinesCount, setPendingLinesCount] = useState(0);
  const [pendingHeadersCount, setPendingHeadersCount] = useState(0);
  const [loadingPending, setLoadingPending] = useState(true);
  const [errorPending, setErrorPending] = useState(null);

  // 🆕 Estados para días completos del calendario
  const [completeDaysCount, setCompleteDaysCount] = useState(0);
  const [loadingCompleteDays, setLoadingCompleteDays] = useState(true);
  const [errorCompleteDays, setErrorCompleteDays] = useState(null);

  // 🆕 Obtener activeAccount y displayName antes de userEmail
  let displayName = "usuario";
  let activeAccount = null;
  try {
    activeAccount = instance.getActiveAccount() || accounts[0];
    displayName = activeAccount?.name || activeAccount?.username || "usuario";
  } catch {
    /* ignore */
  }

  // 🆕 Obtener userEmail usando useMemo para evitar problemas de orden
  const userEmail = useMemo(() => {
    try {
      const acct = activeAccount || accounts[0];
      return acct?.username || acct?.email || "";
    } catch {
      return "";
    }
  }, [activeAccount, accounts]);

  // Cargar fecha del servidor al montar el componente
  useEffect(() => {
    const loadServerDate = async () => {
      try {
        const date = await getServerDate();
        setServerDate(date);
        setAllocationPeriod(generateAllocationPeriod(date));
      } catch (error) {
        console.error("Error cargando fecha del servidor:", error);
        // Fallback a fecha local
        const now = new Date();
        setServerDate(now);
        setAllocationPeriod(generateAllocationPeriod(now));
      }
    };

    loadServerDate();
  }, []);

  // 🆕 Cargar datos de partes de trabajo rechazados
  useEffect(() => {
    const loadRejectedData = async () => {
      if (!userEmail || !allocationPeriod) return;

      try {
        setLoadingRejected(true);
        setErrorRejected(null);

        // Obtener el recurso del usuario actual
        const { data: resourceData, error: resourceError } =
          await supabaseClient
            .from("resource")
            .select("code")
            .eq("email", userEmail)
            .single();

        if (resourceError || !resourceData) {
          console.error("Error obteniendo recurso:", resourceError);
          setErrorRejected("No se pudo obtener el recurso");
          return;
        }

        const resourceNo = resourceData.code;

        // Obtener líneas en estado Pending donde el recurso es el responsable
        const { data: linesData, error: linesError } = await supabaseClient
          .from("timesheet")
          .select("id, header_id, status")
          .eq("status", "Pending")
          .eq("resource_responsible", resourceNo);

        if (linesError) {
          console.error("Error obteniendo líneas rechazadas:", linesError);
          setErrorRejected("Error cargando datos");
          return;
        }

        // Contar líneas
        const linesCount = linesData?.length || 0;
        setRejectedLinesCount(linesCount);

        // Contar headers únicos
        const uniqueHeaders = new Set(
          linesData?.map((line) => line.header_id) || []
        );
        const headersCount = uniqueHeaders.size;
        setRejectedHeadersCount(headersCount);
      } catch (error) {
        console.error("Error cargando datos de partes rechazadas:", error);
        setErrorRejected("Error inesperado");
      } finally {
        setLoadingRejected(false);
      }
    };

    loadRejectedData();
  }, [userEmail, allocationPeriod]);

  // 🆕 Cargar datos de partes de trabajo pendientes de aprobar
  useEffect(() => {
    const loadPendingData = async () => {
      if (!userEmail || !allocationPeriod) {
        return;
      }

      try {
        setLoadingPending(true);
        setErrorPending(null);

        // Obtener el recurso del usuario actual
        const { data: resourceData, error: resourceError } =
          await supabaseClient
            .from("resource")
            .select("code")
            .eq("email", userEmail)
            .single();

        if (resourceError || !resourceData) {
          console.error("Error obteniendo recurso:", resourceError);
          setErrorPending("No se pudo obtener el recurso");
          return;
        }

        const resourceNo = resourceData.code;

        // Obtener líneas en estado Pending donde el recurso es el responsable
        // pero que NO han sido enviadas a aprobación (synced_to_bc = false)

        const { data: linesData, error: linesError } = await supabaseClient
          .from("timesheet")
          .select("id, header_id, status, synced_to_bc")
          .eq("status", "Pending")
          .eq("resource_responsible", resourceNo)
          .eq("synced_to_bc", false);

        if (linesError) {
          console.error("Error obteniendo líneas pendientes:", linesError);
          setErrorPending("Error cargando datos");
          return;
        }

        // Contar líneas
        const linesCount = linesData?.length || 0;
        setPendingLinesCount(linesCount);

        // Contar headers únicos
        const uniqueHeaders = new Set(
          linesData?.map((line) => line.header_id) || []
        );
        const headersCount = uniqueHeaders.size;
        setPendingHeadersCount(headersCount);
      } catch (error) {
        console.error("Error cargando datos de partes pendientes:", error);
        setErrorPending("Error inesperado");
      } finally {
        setLoadingPending(false);
      }
    };

    loadPendingData();
  }, [userEmail, allocationPeriod]);

  // 🆕 Cargar días completos del calendario
  useEffect(() => {
    const loadCompleteDays = async () => {
      if (!userEmail || !allocationPeriod) {
        return;
      }

      try {
        setLoadingCompleteDays(true);
        setErrorCompleteDays(null);

        // Obtener el recurso del usuario actual
        const { data: resourceData, error: resourceError } =
          await supabaseClient
            .from("resource")
            .select("code, calendar_type")
            .eq("email", userEmail)
            .single();

        if (resourceError || !resourceData) {
          console.error(
            "Error obteniendo recurso para días completos:",
            resourceError
          );
          setErrorCompleteDays("No se pudo obtener el recurso");
          return;
        }

        // Obtener días del calendario para el período actual
        const { data: calendarDays, error: calendarError } =
          await supabaseClient
            .from("calendar_period_days")
            .select("day, hours_working, holiday")
            .eq("allocation_period", allocationPeriod)
            .eq("calendar_code", resourceData.calendar_type);

        if (calendarError) {
          console.error("Error obteniendo días del calendario:", calendarError);
          setErrorCompleteDays("Error cargando calendario");
          return;
        }

        // Obtener el header del timesheet para el período actual
        const { data: headerData, error: headerError } = await supabaseClient
          .from("resource_timesheet_header")
          .select("id")
          .eq("resource_no", resourceData.code)
          .eq("allocation_period", allocationPeriod)
          .maybeSingle();

        if (headerError || !headerData) {
          console.error(
            "Error obteniendo header para días completos:",
            headerError
          );
          setErrorCompleteDays("No se encontró header para el período");
          return;
        }

        // Obtener líneas de timesheet para calcular días completos
        const { data: timesheetLines, error: timesheetError } =
          await supabaseClient
            .from("timesheet")
            .select("date, quantity")
            .eq("header_id", headerData.id);

        if (timesheetError) {
          console.error(
            "Error obteniendo líneas de timesheet:",
            timesheetError
          );
          setErrorCompleteDays("Error cargando timesheet");
          return;
        }

        // Calcular días faltantes por completar usando la misma lógica que el calendario
        const EPS = 0.01;
        let incompleteDays = 0;
        let _completeDays = 0;
        let _holidayDays = 0;

        calendarDays.forEach((calendarDay) => {
          // Los festivos vienen marcados con holiday = true desde la BD
          if (calendarDay.holiday === true) {
            _holidayDays++;
            return; // Saltar festivos
          }

          // Buscar líneas para este día usando la fecha del calendario
          const dayLines = timesheetLines.filter(
            (line) => line.date === calendarDay.day
          );
          const totalHours = dayLines.reduce(
            (sum, line) => sum + (line.quantity || 0),
            0
          );

          // Usar las horas requeridas del calendario (calendarDay.hours_working)
          const requiredHours = calendarDay.hours_working || 0;

          // Contar días que NO están completos (faltan por completar)
          if (requiredHours > 0 && totalHours < requiredHours - EPS) {
            incompleteDays++;
          } else if (requiredHours > 0) {
            completeDays++;
          }
        });

        setCompleteDaysCount(incompleteDays);
      } catch (error) {
        console.error("Error cargando días completos:", error);
        setErrorCompleteDays("Error inesperado");
      } finally {
        setLoadingCompleteDays(false);
      }
    };

    loadCompleteDays();
  }, [userEmail, allocationPeriod]);

  useEffect(() => {
    if (location.state && location.state.modal === "resource-missing") {
      setShowMissingModal(true);
      setMissingEmail(location.state.email || "");
      // limpiar el estado para no reabrir en siguiente navegación
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const [userPhoto, setUserPhoto] = useState("");
  const [pendingHours, setPendingHours] = useState(null);
  const [loadingHours, setLoadingHours] = useState(true);
  const [errorHours, setErrorHours] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPhoto() {
      try {
        if (!activeAccount) return;
        const result = await instance.acquireTokenSilent({
          account: activeAccount,
          scopes: ["User.Read"],
        });
        const res = await fetch(
          "https://graph.microsoft.com/v1.0/me/photos/64x64/$value",
          {
            headers: { Authorization: `Bearer ${result.accessToken}` },
          }
        );
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (!cancelled) setUserPhoto(url);
      } catch {
        /* ignore */
      }
    }
    loadPhoto();
    return () => {
      cancelled = true;
    };
  }, [activeAccount, instance]);

  useEffect(() => {
    let cancelled = false;

    async function loadPendingHours() {
      try {
        setLoadingHours(true);
        setErrorHours("");
        if (!userEmail) {
          console.log(
            "🔍 No hay userEmail, estableciendo horas pendientes a 0"
          );
          setPendingHours(0);
          return;
        }

        const { data, error } = await supabaseClient.rpc("pending_hours", {
          p_email: userEmail,
        });

        if (error) throw error;
        const pendientes =
          data && data[0] && typeof data[0].pendientes === "number"
            ? data[0].pendientes
            : 0;

        if (!cancelled) setPendingHours(pendientes);
      } catch (e) {
        console.error("Error en loadPendingHours:", e);
        if (!cancelled)
          setErrorHours(e.message || "Error calculando horas pendientes");
      } finally {
        if (!cancelled) setLoadingHours(false);
      }
    }

    loadPendingHours();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  // allocationPeriod ahora viene del servidor via useState
  const goToEditParte = () => {
    if (!allocationPeriod) return;
    navigate(`/editar-parte?allocation_period=${allocationPeriod}`);
  };
  const goToNuevoParte = () => {
    if (!allocationPeriod) return;
    navigate(`/nuevo-parte?allocation_period=${allocationPeriod}`);
  };

  const navigateToParteActual = async () => {
    if (!allocationPeriod) return;

    try {
      // Determinar recurso del usuario
      let email = "";
      try {
        const acct = instance.getActiveAccount() || accounts[0];
        email = acct?.username || acct?.email || "";
      } catch {
        /* ignore */
      }
      let resourceNo = null;
      if (email) {
        const { data: r } = await supabaseClient
          .from("resource")
          .select("code")
          .eq("email", email)
          .maybeSingle();
        resourceNo = r?.code || null;
      }
      if (!resourceNo) {
        // Si no determinamos recurso, ir a nuevo parte (creará guard/modal si falta)
        goToNuevoParte();
        return;
      }
      const { data: h } = await supabaseClient
        .from("resource_timesheet_header")
        .select("id")
        .eq("resource_no", resourceNo)
        .eq("allocation_period", allocationPeriod)
        .maybeSingle();
      if (h?.id) goToEditParte();
      else goToNuevoParte();
    } catch {
      goToNuevoParte();
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      });
    } catch {
      try {
        await instance.logoutPopup({
          postLogoutRedirectUri: window.location.origin,
        });
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="dash">
      {showMissingModal && (
        <BcModal
          isOpen={true}
          onClose={() => setShowMissingModal(false)}
          title="Recurso no encontrado"
          confirmText="Aceptar"
          onConfirm={() => setShowMissingModal(false)}
          oneButton={true}
        >
          <p>
            No se encontró un recurso asociado al email{" "}
            {missingEmail || userEmail || "(desconocido)"}. Por favor, contacta
            con Recursos Humanos para dar de alta tu recurso en el sistema.
          </p>
        </BcModal>
      )}
      <nav
        className="bc-menu"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div className="bc-menu-item">
            <Link to="/nuevo-parte">Nuevo Parte de Trabajo</Link>
          </div>
          <div className="bc-menu-item">
            <Link to="/mis-partes">Editar Partes de Trabajo</Link>
          </div>
        </div>
        <div
          ref={menuRef}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Versión de la aplicación */}
          <div
            style={{
              fontSize: "0.8rem",
              color: "#666",
              backgroundColor: "#f5f5f5",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              marginRight: "8px",
            }}
          >
            {serverDate
              ? serverDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Cargando..."}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#666",
              backgroundColor: "#f5f5f5",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            v
            {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0"}
          </div>
          <button
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: "9999px",
              padding: 0,
              width: 36,
              height: 36,
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="Foto de usuario"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#e5e7eb",
                  fontWeight: 700,
                }}
              >
                {(displayName || "U").charAt(0)}
              </div>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                minWidth: 220,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: 8,
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                  }}
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#e5e7eb",
                        fontWeight: 700,
                      }}
                    >
                      {(displayName || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600 }}>{displayName}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {userEmail}
                  </span>
                </div>
              </div>
              <div
                style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }}
              />
              <button
                onClick={handleLogout}
                role="menuitem"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>

      <header
        className="dash__header"
        style={{
          padding: "8px 0",
          borderBottom: "1px solid #d9d9d9",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#008489",
            margin: 0,
          }}
        >
          {getGreeting()}, {displayName}.
        </h2>
      </header>

      <section className="dash__grid dashboard-grid">
        <article
          className="bc-card dashboard-card"
          role="button"
          tabIndex={0}
          onClick={navigateToParteActual}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && navigateToParteActual()
          }
        >
          <h3 className="bc-card__title">
            Horas y días pendientes de imputar este mes
          </h3>
          <div className="bc-card__value">
            {loadingHours ? (
              "…"
            ) : errorHours ? (
              "—"
            ) : loadingCompleteDays ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                <span>{Math.round(pendingHours || 0)} Horas</span>
                <span>•</span>
                <span>…</span>
              </div>
            ) : errorCompleteDays ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                <span>{Math.round(pendingHours || 0)} Horas</span>
                <span>•</span>
                <span>—</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                <span>{Math.round(pendingHours || 0)} Horas</span>
                <span>•</span>
                <span>
                  {completeDaysCount} {completeDaysCount === 1 ? "Día" : "Días"}
                </span>
              </div>
            )}
          </div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article
          className="bc-card dashboard-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/aprobacion")}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && navigate("/aprobacion")
          }
        >
          <h3 className="bc-card__title">
            Partes de trabajo pendientes de aprobar
          </h3>
          <div className="bc-card__value">
            {loadingPending ? (
              "…"
            ) : errorPending ? (
              "—"
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                <span>{rejectedLinesCount} líneas</span>
                <span>•</span>
                <span>
                  {rejectedHeadersCount}{" "}
                  {rejectedHeadersCount === 1 ? "parte" : "partes"}
                </span>
              </div>
            )}
          </div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article className="bc-card dashboard-card">
          <h3 className="bc-card__title">Partes de trabajo rechazadas</h3>
          <div className="bc-card__value">
            {loadingPending ? (
              "…"
            ) : errorPending ? (
              "—"
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                <span>{pendingLinesCount} líneas</span>
                <span>•</span>
                <span>
                  {pendingHeadersCount}{" "}
                  {pendingHeadersCount === 1 ? "parte" : "partes"}
                </span>
              </div>
            )}
          </div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article className="bc-card dashboard-card">
          <h3 className="bc-card__title">Notas de gasto rechazadas</h3>
          <div className="bc-card__value">0</div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article className="bc-card dashboard-card">
          <h3 className="bc-card__title">
            Notas de gasto pendientes de aprobar
          </h3>
          <div className="bc-card__value">0</div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>
      </section>
    </div>
  );
};

export default HomeDashboard;
