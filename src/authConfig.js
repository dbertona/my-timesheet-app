// Configuración de MSAL con crypto nativo
const REDIRECT_URI =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MSAL_REDIRECT_URI) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

const POST_LOGOUT_URI =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MSAL_POSTLOGOUT) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

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
        if (containsPii) {
          return;
        }
        console.log(`MSAL ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: "Info",
    },
  },
};
