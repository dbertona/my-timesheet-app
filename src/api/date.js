// API para obtener la fecha actual del servidor
export async function getServerDate() {
  // En desarrollo, usar fecha local directamente para evitar errores 500
  if (import.meta.env.DEV) {
    console.log("🔧 Modo desarrollo: usando fecha local");
    return new Date();
  }

  try {
    const response = await fetch("/api/server-date", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return new Date(data.date);
  } catch (error) {
    console.error("Error obteniendo fecha del servidor:", error);
    // Fallback a fecha local si falla
    return new Date();
  }
}

// Función helper para generar el período de asignación basado en una fecha
export function generateAllocationPeriod(date) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `M${yy}-M${mm}`;
}
