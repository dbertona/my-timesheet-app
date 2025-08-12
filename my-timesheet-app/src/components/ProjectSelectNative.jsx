import React from "react";
import { useOpenProjectsByResource } from "../hooks/useOpenProjectsByResource";

export default function ProjectSelectNative({
  resourceNo,          // código del recurso actual (string)
  value,               // job_no seleccionado
  onChange,            // (jobNo) => void
  label = "Proyecto",
  placeholder = "Selecciona un proyecto…",
  disabled = false,
}) {
  const { projects, loading, error } = useOpenProjectsByResource(resourceNo);

  const handleChange = (e) => {
    const v = e.target.value || null;
    onChange?.(v);
  };

  const isDisabled = disabled || loading || !resourceNo;

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <select
        className={`w-full rounded-lg border px-3 py-2 bg-white ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
        value={value ?? ""}
        onChange={handleChange}
        disabled={isDisabled}
      >
        <option value="" disabled>
          {loading ? "Cargando proyectos…" : placeholder}
        </option>

        {/* Si hubo error, mostramos opción informativa sin romper el flow */}
        {error && <option disabled value="">Error al cargar</option>}

        {projects.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}

        {/* Si no hay proyectos disponibles */}
        {!loading && !error && projects.length === 0 && (
          <option disabled value="">Sin proyectos asignados</option>
        )}
      </select>

      {/* Mensajes auxiliares */}
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error.message || "No se pudieron cargar los proyectos."}
        </p>
      )}
      {!resourceNo && (
        <p className="mt-1 text-xs text-gray-500">
          Indica un recurso para listar sus proyectos.
        </p>
      )}
    </div>
  );
}
