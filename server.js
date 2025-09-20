import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

// Carga las variables de entorno del fichero .env en el directorio actual
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // Guardar body crudo para hash/auditoría
  },
}));

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

// Endpoint para recibir webhooks de Factorial (solo validación y logging inicial)
app.post("/webhooks/factorial/:companyId/:eventType", async (req, res) => {
  const { companyId, eventType } = req.params;

  // Validar que el companyId y el eventType sean esperados
  if (!['psi', 'psl'].includes(companyId)) {
    console.warn(`Webhook recibido para empresa no válida: ${companyId}`);
    return res.status(400).json({ error: "Empresa no válida" });
  }
  if (!['leave_create', 'leave_update', 'leave_delete'].includes(eventType)) {
    console.warn(`Webhook recibido con tipo de evento no válido: ${eventType}`);
    return res.status(400).json({ error: "Tipo de evento no válido" });
  }

  // Obtener la API key correspondiente a la empresa
  const apiKeys = {
    psi: process.env.FACTORIAL_API_KEY_PSI,
    psl: process.env.FACTORIAL_API_KEY_PSL
  };
  const apiKey = apiKeys[companyId];

  // Detectar tipo de API key: JWT (x-api-key) vs Bearer
  const isJwtKey = typeof apiKey === 'string' && apiKey.startsWith('eyJ');

  // Seleccionar base por empresa o aplicar fallback según tipo de key
  let apiBase = companyId === 'psi' ? process.env.FACTORIAL_API_BASE_PSI : process.env.FACTORIAL_API_BASE_PSL;
  if (!apiBase) {
    apiBase = isJwtKey ? 'https://api.factorialhr.com/api/2025-07-01' : 'https://api.factorialhr.com/api/v1';
  }

  if (!apiKey) {
    console.error(`No se encontró API key para la empresa: ${companyId}`);
    return res.status(400).send('Empresa no configurada');
  }

  console.log(`Procesando webhook para ${companyId} usando la API Key que empieza con: ${apiKey.substring(0, 5)}... y base URL: ${apiBase}`);

  // El payload viene directamente en el body para los webhooks de Factorial
  const absenceData = req.body;
  console.log('Payload del webhook:', absenceData);

  // 1. Challenge de verificación de Factorial
  const challenge = req.headers["x-factorial-wh-challenge"] || req.query.challenge;
  if (challenge) {
    console.log(`Webhook [${companyId}/${eventType}]: Challenge recibido y verificado: ${challenge}`);
    return res.status(200).send(String(challenge));
  }

  // 2. Logging estructurado del evento (ajustado al payload real)
  const {
    id: eventId, // Renombramos 'id' para evitar confusión con el 'id' de la ausencia
    employee_id,
    start_on,
    finish_on,
    half_day,
    approved,
    updated_at,
    created_at,
  } = req.body;

  let employeeEmail = null;

  // Si hay un employee_id, buscamos el email con la API adecuada
  if (employee_id) {
    try {
      if (isJwtKey) {
        // API moderna (x-api-key) → usar resources/employees con include=user y buscar por ID
        const employees = await fetchAllEmployees(apiBase, apiKey);
        const employee = employees.find((e) => String(e?.id) === String(employee_id));
        employeeEmail = employee?.user?.email
          || employee?.email
          || employee?.work_email
          || employee?.login_email
          || employee?.personal_email
          || null;
      } else {
        // API v1 (Bearer) → endpoint directo por ID
        const employeeUrl = `${apiBase}/employees/${employee_id}`;
        const response = await fetch(employeeUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (response.ok) {
          const employeeData = await response.json();
          employeeEmail = employeeData?.email || null;
        } else {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Error al obtener empleado ${employee_id}: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Error resolviendo email del empleado desde Factorial:", error);
      // Continuamos sin el email si falla
    }
  }


  console.log('--- INICIO PAYLOAD CRUDO ---');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('--- FIN PAYLOAD CRUDO ---');

  console.log(`
    -----------------------------------------
    Webhook de Factorial recibido [${companyId}]
    -----------------------------------------
    - Evento ID: ${eventId}
    - Tipo: ${eventType}
    - Creado en: ${created_at}
    - Empleado ID: ${employee_id}
    - Empleado Email: ${employeeEmail || 'No encontrado'}
    - Fechas: ${start_on} a ${finish_on}
    - Medio día: ${half_day}
    - Estado: ${approved ? 'Aprobado' : 'No aprobado'}
    - Actualizado en: ${updated_at}
    -----------------------------------------
  `);

  // Aquí iría la lógica para procesar el evento en Supabase,
  // diferenciando por `companyId` y `eventType`
  res.status(200).json({ received: true, processed: false, message: "Evento loggeado, no procesado." });
});


// Fallback para SPA
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Fecha del servidor: ${new Date().toISOString()}`);
});
