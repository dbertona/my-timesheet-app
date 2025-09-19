import cors from "cors";
import express from "express";
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
function normalizeEmail(value) {
  if (!value && value !== 0) return "";
  try {
    return String(value).trim().toLowerCase();
  } catch {
    return "";
  }
}

async function fetchAllEmployees(apiBase, apiKey) {
  const aggregated = [];
  const perPage = 200;
  let currentPage = 1;
  const maxPages = 50; // salvaguarda

  while (currentPage <= maxPages) {
    const url = `${apiBase}/resources/employees/employees?per_page=${perPage}&page=${currentPage}&include=user`;
    const response = await fetch(url, { headers: { "x-api-key": apiKey } });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Employees error ${response.status}: ${response.statusText} - ${text}`
      );
    }
    const json = await response.json().catch(() => ({}));
    const pageData = Array.isArray(json?.data) ? json.data : [];
    if (pageData.length === 0) break;
    aggregated.push(...pageData);
    currentPage += 1;
  }

  return aggregated;
}

function generateEmailVariants(inputEmail) {
  // Reglas: usar el email de login; si no coincide, probar local-part@ps-grupo.net
  const normalized = normalizeEmail(inputEmail);
  if (!normalized) return [];
  const [localPart] = normalized.split("@");
  const variants = new Set();
  variants.add(normalized);
  if (localPart) {
    // Dominios alternativos conocidos entre empresas del grupo
    variants.add(`${localPart}@ps-grupo.net`);
    variants.add(`${localPart}@ps-lab.net`);
    variants.add(`${localPart}@powersolution.es`);
    variants.add(`${localPart}@power-solution.es`);
  }
  return Array.from(variants).filter(Boolean);
}

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
  const hasSupabaseEnv = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  if (!companyFromSupabase && !hasSupabaseEnv) {
    // No podemos resolver empresa en testing si faltan credenciales de Supabase
    try {
      console.warn(
        `Factorial company resolve FAILED (no SUPABASE env). email=${userEmail}`
      );
    } catch {}
    return res
      .status(424)
      .json({ error: "company_not_resolved", message: "Backend no puede resolver la empresa del recurso (faltan credenciales de Supabase en testing)." });
  }
  try {
    console.log(
      `Factorial company resolve: email=${userEmail}, supabase_company=${companyFromSupabase} env_has_anon=${Boolean(process.env.SUPABASE_ANON_KEY)} env_has_service=${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`
    );
  } catch {}
    const keyCompanyA = process.env.FACTORIAL_API_KEY; // Empresa A (por defecto)
    const keyCompanyB = process.env.FACTORIAL_API_KEY_B; // Empresa B
    if (
      companyLc.includes("ps lab") ||
      companyLc.includes("consulting") ||
      companyLc.includes("pslab")
    ) {
      apiKey = keyCompanyB || apiKey;
    try { console.log("Factorial key selected: B (PSLAB)"); } catch {}
    } else {
      apiKey = keyCompanyA || apiKey;
    try { console.log("Factorial key selected: A (PSI)"); } catch {}
    }

    if (!apiKey) {
      console.error("FACTORIAL_API_KEY no configurado en variables de entorno");
      return res.status(500).json({
        error:
          "Configuración faltante: FACTORIAL_API_KEY. Defina la variable de entorno para habilitar la integración.",
      });
    }

    // 1) Buscar employee_id por email (comparando múltiples campos y con paginación)
    let employees = [];
    try {
      employees = await fetchAllEmployees(apiBase, apiKey);
    } catch (err) {
      console.error(String(err));
      return res.status(502).json({ error: "Error obteniendo empleados" });
    }

    const variants = generateEmailVariants(userEmail);
    const employee = employees.find((e) => {
      const candidates = [
        e?.email,
        e?.login_email,
        e?.work_email,
        e?.personal_email,
        e?.user?.email,
        e?.user?.login_email,
      ]
        .map((v) => normalizeEmail(v))
        .filter(Boolean);
      return candidates.some((c) => variants.includes(c));
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
      return {
        desde,
        hasta,
        tipo,
        half_day: l?.half_day,
      };
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
