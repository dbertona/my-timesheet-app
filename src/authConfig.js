// Configuración simplificada de MSAL
export const msalConfig = {
  auth: {
    clientId: "3975625e-617d-410c-a166-9a3c88563344",
    authority:
      "https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb",
    redirectUri:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173",
    postLogoutRedirectUri:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    iframeHashTimeout: 10000,
    loadFrameTimeout: 10000,
    allowNativeBroker: false,
  },
};
