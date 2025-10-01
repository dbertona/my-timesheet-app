// Configuración de MSAL con crypto nativo
const BASE_PATH = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BASE_PATH) || "/";

const REDIRECT_URI =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MSAL_REDIRECT_URI) ||
  (typeof window !== "undefined"
    ? `${window.location.origin}${BASE_PATH}`
    : `http://localhost:5173${BASE_PATH}`);

const POST_LOGOUT_URI =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MSAL_POSTLOGOUT) ||
  (typeof window !== "undefined"
    ? `${window.location.origin}${BASE_PATH}`
    : `http://localhost:5173${BASE_PATH}`);

export const msalConfig = {
  auth: {
    clientId: "3975625e-617d-410c-a166-9a3c88563344",
    authority:
      "https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb",
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    iframeHashTimeout: 10000,
    loadFrameTimeout: 10000,
    allowNativeBroker: false,
    // Preferir Web Crypto si está disponible; MSAL hará fallback interno si no
    cryptoOptions: {
      useMsalCrypto: true,
    },
    // Configuración adicional para entornos de testing
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        const msg = String(message || "");
        // Ignorar warning benigno de múltiples instancias en HMR
        if (msg.includes("There is already an instance of MSAL.js")) return;
        // Solo avisos y errores para reducir ruido en consola
        try {
          const lvl = typeof level === "string" ? level.toLowerCase() : String(level);
          const isError = lvl.includes("error") || level === 0;
          const isWarning = lvl.includes("warn") || level === 1;
          if (isError) {
            console.error(`MSAL ${level}: ${msg}`);
          } else if (isWarning) {
            console.warn(`MSAL ${level}: ${msg}`);
          }
        } catch {
          /* ignore */
        }
      },
      piiLoggingEnabled: false,
      logLevel: "Warning",
    },
  },
};
