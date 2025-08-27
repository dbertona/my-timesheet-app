import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export default function RequireMsalAuth({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = Array.isArray(accounts) && accounts.length > 0;

  useEffect(() => {
    if (!isAuthenticated && inProgress === "none") {
      instance
        .loginRedirect({ scopes: ["User.Read"], prompt: "select_account" })
        .catch(() => {});
    }
  }, [isAuthenticated, inProgress, instance]);

  if (!isAuthenticated) {
    return null; // o spinner si quieres
  }
  return children;
}
