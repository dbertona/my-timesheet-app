import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function BackToDashboard({ compact = false }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Volver al Dashboard"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.05)",
          backgroundColor: hover ? "#D9EEF1" : "#E6F5F7",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2f3a3a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
          <path d="M20 12H10"></path>
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="ts-btn ts-btn--secondary"
      onClick={() => navigate("/")}
      aria-label="Volver al Dashboard"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
        <path d="M20 12H10"></path>
      </svg>
      Volver al Dashboard
    </button>
  );
}

export default BackToDashboard;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function BackToDashboard({ compact = false }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  if (compact) {
    // Botón circular estilo BC con icono de flecha y tono de fondo en hover
    return (
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Volver al Dashboard"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.05)",
          backgroundColor: hover ? "#D9EEF1" : "#E6F5F7",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2f3a3a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
          <path d="M20 12H10"></path>
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="ts-btn ts-btn--secondary"
      onClick={() => navigate("/")}
      aria-label="Volver al Dashboard"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
        <path d="M20 12H10"></path>
      </svg>
      Volver al Dashboard
    </button>
  );
}

export default BackToDashboard;


