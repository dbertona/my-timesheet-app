import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";

export default function RequireMsalAuth({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = Array.isArray(accounts) && accounts.length > 0;

  useEffect(() => {
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
  }, [isAuthenticated, inProgress, instance]);

  if (!isAuthenticated) {
    return null; // o spinner si quieres
  }
  return children;
}
