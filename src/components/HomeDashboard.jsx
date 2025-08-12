import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import "../styles/HomeDashboard.css";
import { supabaseClient } from "../supabaseClient";

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function lastDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function toISODate(d) {
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return z.toISOString().slice(0, 10);
}

const HomeDashboard = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const { instance, accounts } = useMsal();
  let displayName = "usuario";
  try {
    const active = instance.getActiveAccount() || accounts[0];
    displayName = active?.name || active?.username || "usuario";
  } catch {
    // fallback
  }

  let userEmail = "";
  try {
    const acct = instance.getActiveAccount() || accounts[0];
    userEmail = acct?.username || acct?.email || "";
  } catch {
    userEmail = "";
  }

  const [pendingHours, setPendingHours] = useState(null);
  const [loadingHours, setLoadingHours] = useState(true);
  const [errorHours, setErrorHours] = useState("");

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

        // RPC directa a la función creada en Supabase
        const { data, error } = await supabaseClient.rpc('pending_hours', { p_email: userEmail });
        if (error) throw error;
        const pendientes = data && data[0] && typeof data[0].pendientes === 'number' ? data[0].pendientes : 0;
        if (!cancelled) setPendingHours(pendientes);
      } catch (e) {
        if (!cancelled) setErrorHours(e.message || "Error calculando horas pendientes");
      } finally {
        if (!cancelled) setLoadingHours(false);
      }
    }

    loadPendingHours();
    return () => { cancelled = true; };
  }, [userEmail]);

  const navigate = useNavigate();
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2); // e.g. "25"
  const mm = String(now.getMonth() + 1).padStart(2, "0"); // e.g. "08"
  const allocationPeriod = `M${yy}-M${mm}`; // e.g. M25-M08
  const goToEditParte = () => {
    navigate(`/editar-parte?allocation_period=${allocationPeriod}`);
  };

  return (
    <div className="dash">
      <nav className="bc-menu">
        <div className="bc-menu-item">
          <Link to="/nuevo-parte">Nuevo Parte de Trabajo</Link>
        </div>
        <div className="bc-menu-item">
          <Link to="/editar-parte">Editar Partes de Trabajo</Link>
        </div>
      </nav>

      <header className="dash__header" style={{ padding: "8px 0", borderBottom: "1px solid #d9d9d9", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#008489", margin: 0 }}>
          {getGreeting()}, {displayName}.
        </h2>
      </header>

      <section className="dash__grid dashboard-grid">
        <article
          className="bc-card dashboard-card"
          role="button"
          tabIndex={0}
          onClick={goToEditParte}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToEditParte()}
        >
          <h3 className="bc-card__title">Horas pendientes de imputar este mes</h3>
          <div className="bc-card__value">
            {loadingHours ? "…" : errorHours ? "—" : `${Math.round(pendingHours || 0)}H`}
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
          <h3 className="bc-card__title">Partes de trabajo pendientes de aprobar</h3>
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
          <h3 className="bc-card__title">Notas de gasto pendientes de aprobar</h3>
          <div className="bc-card__value">0</div>
          <div className="bc-card__line"></div>
          <div className="bc-card__icon">&gt;</div>
        </article>
      </section>
    </div>
  );
};

export default HomeDashboard;
