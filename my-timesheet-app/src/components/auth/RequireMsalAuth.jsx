import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";

export default function RequireMsalAuth({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = Array.isArray(accounts) && accounts.length > 0;

  // Bypass de autenticación para tests E2E
  const isE2EBypass = import.meta.env?.VITE_E2E_AUTH_BYPASS === 'true';

  useEffect(() => {
    // Si está en modo E2E bypass, no hacer login
    if (isE2EBypass) {
      return;
    }

    if (!isAuthenticated && inProgress === "none") {
      const basePath = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BASE_PATH) || "/";
      const redirectUri =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_MSAL_REDIRECT_URI) ||
        `${window.location.origin}${basePath}`;
      instance
        .loginRedirect({
          scopes: ["User.Read"],
          prompt: "select_account",
          redirectUri,
        })
        .catch(() => {});
    }
  }, [isAuthenticated, inProgress, instance, isE2EBypass]);

  // En modo E2E bypass, siempre mostrar children
  if (isE2EBypass) {
    return children;
  }

  if (!isAuthenticated) {
    return null; // o spinner si quieres
  }
  return children;
}
