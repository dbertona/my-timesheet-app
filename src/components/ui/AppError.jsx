import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";

export default function AppError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Se produjo un error";
  let message = "Ha ocurrido un error inesperado.";
  let status = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = `Error ${error.status}`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  const handleRetry = () => {
    try {
      // Intentar recargar la ruta actual
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleGoHome = () => {
    try {
      navigate("/");
    } catch {
      // ignore
    }
  };

  const isDev = Boolean(import.meta?.env?.DEV);

  return (
    <div
      style={{
        padding: 24,
        margin: 24,
        border: "1px solid #f5c2c7",
        background: "#f8d7da",
        color: "#842029",
        borderRadius: 8,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h2>
      <div style={{ marginBottom: 16 }}>{message}</div>
      {status ? (
        <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.9 }}>
          Código: {status}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleRetry}
          style={{
            padding: "8px 12px",
            background: "#842029",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>

        <button
          type="button"
          onClick={handleGoHome}
          style={{
            padding: "8px 12px",
            background: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Volver al inicio
        </button>
      </div>

      {isDev && error ? (
        <details style={{ marginTop: 16 }}>
          <summary>Detalles técnicos</summary>
          <pre
            style={{
              overflow: "auto",
              background: "#fff",
              color: "#000",
              padding: 12,
              borderRadius: 6,
            }}
          >
            {String(
              error?.stack ||
                JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            )}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
