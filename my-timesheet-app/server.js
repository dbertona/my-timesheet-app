import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde dist
app.use(express.static(path.join(__dirname, "dist")));

// Helpers
async function getResourceCompanyByEmail(email) {
  try {
    const baseUrl = process.env.SUPABASE_PROJECT_URL;
    const apiKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!baseUrl || !apiKey) return null;

    const url = `${baseUrl}/rest/v1/resource?select=company_name&email=eq.${encodeURIComponent(
      email
    )}&limit=1`;
    const resp = await fetch(url, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0]?.company_name || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Endpoint para obtener la fecha del servidor
// Si existe FORCE_SERVER_DATE se usa como fecha forzada (útil para testing)
app.get("/api/server-date", (req, res) => {
  try {
    const forced = process.env.FORCE_SERVER_DATE;
    const serverDate = forced ? new Date(forced) : new Date();

    if (Number.isNaN(serverDate.getTime())) {
      throw new Error(
        `Valor inválido en FORCE_SERVER_DATE: ${forced}. Formatos válidos: ISO 8601, p.ej. 2025-08-15T12:00:00Z`
      );
    }

    res.json({
      date: serverDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: serverDate.getTime(),
    });
  } catch (error) {
    console.error("Error obteniendo fecha del servidor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Endpoint para factorial (integración real via API REST de Factorial)
app.post("/api/factorial/vacations", async (req, res) => {
  try {
    const { userEmail, startDate, endDate } = req.body || {};

    console.log(
      `Factorial request: ${userEmail} from ${startDate} to ${endDate}`
    );

    if (!userEmail || !startDate || !endDate) {
      return res.status(400).json({
        error: "Parámetros inválidos. Requiere userEmail, startDate, endDate",
      });
    }

    const apiBase =
      process.env.FACTORIAL_API_BASE ||
      "https://api.factorialhr.com/api/2025-07-01";
    // Selección dinámica de API key por empresa
    let apiKey = process.env.FACTORIAL_API_KEY;
    const companyFromSupabase = await getResourceCompanyByEmail(userEmail);
    const companyLc = (companyFromSupabase || "").toLowerCase();
    const keyCompanyA = process.env.FACTORIAL_API_KEY; // Empresa A (por defecto)
    const keyCompanyB = process.env.FACTORIAL_API_KEY_B; // Empresa B
    if (
      companyLc.includes("ps lab") ||
      companyLc.includes("consulting") ||
      companyLc.includes("pslab")
    ) {
      apiKey = keyCompanyB || apiKey;
    } else {
      apiKey = keyCompanyA || apiKey;
    }

    if (!apiKey) {
      console.error("FACTORIAL_API_KEY no configurado en variables de entorno");
      return res.status(500).json({
        error:
          "Configuración faltante: FACTORIAL_API_KEY. Defina la variable de entorno para habilitar la integración.",
      });
    }

    // 1) Buscar employee_id por email (se comparan múltiples campos)
    const employeesUrl = `${apiBase}/resources/employees/employees?per_page=1000&include=user`;
    const empResp = await fetch(employeesUrl, {
      headers: { "x-api-key": apiKey },
    });
    if (!empResp.ok) {
      const text = await empResp.text().catch(() => "");
      console.error(
        `Factorial Employees error ${empResp.status}: ${empResp.statusText} - ${text}`
      );
      return res.status(empResp.status).json({
        error: `Error obteniendo empleados (${empResp.status})`,
      });
    }
    const empJson = await empResp.json().catch(() => ({}));
    const employees = Array.isArray(empJson?.data) ? empJson.data : [];
    const emailLc = String(userEmail || "").toLowerCase();
    const employee = employees.find((e) => {
      const candidates = [
        e?.email,
        e?.work_email,
        e?.personal_email,
        e?.user?.email,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return candidates.includes(emailLc);
    });
    if (!employee || !employee.id) {
      return res
        .status(404)
        .json({ error: `No se encontró empleado con email ${userEmail}` });
    }

    // 2) Obtener ausencias aprobadas en el rango para ese empleado
    const leavesUrl = `${apiBase}/resources/timeoff/leaves?from=${encodeURIComponent(
      startDate
    )}&to=${encodeURIComponent(endDate)}&approved=true&include_leave_type=true&employee_id=${encodeURIComponent(
      employee.id
    )}`;
    const leavesResp = await fetch(leavesUrl, {
      headers: { "x-api-key": apiKey },
    });
    if (!leavesResp.ok) {
      const text = await leavesResp.text().catch(() => "");
      console.error(
        `Factorial Leaves error ${leavesResp.status}: ${leavesResp.statusText} - ${text}`
      );
      return res.status(leavesResp.status).json({
        error: `Error obteniendo ausencias (${leavesResp.status})`,
      });
    }
    const leavesJson = await leavesResp.json().catch(() => ({}));
    const leaves = Array.isArray(leavesJson?.data) ? leavesJson.data : [];

    // Mapear al formato esperado por el frontend y recortar al rango solicitado
    const result = leaves.map((l) => {
      const desdeRaw = (l?.start_on || "").split("T")[0] || startDate;
      const hastaRaw = (l?.finish_on || "").split("T")[0] || endDate;
      const desde = desdeRaw < startDate ? startDate : desdeRaw;
      const hasta = hastaRaw > endDate ? endDate : hastaRaw;
      const tipo = l?.leave_type_name || "Vacaciones";
      return { desde, hasta, tipo };
    });

    return res.json(result);
  } catch (error) {
    console.error("Error en factorial API:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Fallback para SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Fecha del servidor: ${new Date().toISOString()}`);
});
