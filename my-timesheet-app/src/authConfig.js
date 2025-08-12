export const msalConfig = {
  auth: {
    clientId: "3975625e-617d-410c-a166-9a3c88563344",
    authority: "https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb", // 👈 TENANT ID aquí
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};
