// cspell:ignore msal useMsal
/* global __APP_VERSION__ */
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import "../styles/HomeDashboard.css";
import { supabaseClient } from "../supabaseClient";
import BcModal from "./ui/BcModal";
import { getServerDate, generateAllocationPeriod } from "../api/date";

// Helper utilities removidos por no uso para cumplir lint

const HomeDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingEmail, setMissingEmail] = useState("");
  const [serverDate, setServerDate] = useState(null);
  const [allocationPeriod, setAllocationPeriod] = useState(null);

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

  let displayName = "usuario";
  let activeAccount = null;
  try {
    activeAccount = instance.getActiveAccount() || accounts[0];
    displayName = activeAccount?.name || activeAccount?.username || "usuario";
  } catch {
    /* ignore */
  }

  let userEmail = "";
  try {
    const acct = activeAccount || accounts[0];
    userEmail = acct?.username || acct?.email || "";
  } catch {
    userEmail = "";
  }

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
            <Link to="/editar-parte">Editar Partes de Trabajo</Link>
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
            Horas pendientes de imputar este mes
          </h3>
          <div className="bc-card__value">
            {loadingHours
              ? "…"
              : errorHours
                ? "—"
                : `${Math.round(pendingHours || 0)}H`}
          </div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article className="bc-card dashboard-card">
          <h3 className="bc-card__title">Partes de trabajo rechazados</h3>
          <div className="bc-card__value">0</div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>

        <article className="bc-card dashboard-card">
          <h3 className="bc-card__title">
            Partes de trabajo pendientes de aprobar
          </h3>
          <div className="bc-card__value">0</div>
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
