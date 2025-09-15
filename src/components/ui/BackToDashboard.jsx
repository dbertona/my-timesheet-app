import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackToDashboard({
  title = "Volver al Dashboard",
  compact = false,
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: compact ? 0 : 12,
      }}
    >
      <button
        type="button"
        aria-label={title}
        onClick={() => navigate("/")}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#D8EEF1";
          e.currentTarget.style.borderColor = "#007E87";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "rgba(0,126,135,0.35)";
        }}
        style={{
          width: 36,
          height: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          border: "1px solid rgba(0,126,135,0.35)",
          background: "#EAF7F9",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6L9 12L15 18"
            stroke="#007E87"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
