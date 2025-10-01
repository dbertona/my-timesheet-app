import { useMsal } from "@azure/msal-react";
import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabaseClient } from "../../supabaseClient";

export default function EnsureResource() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);

  // Bypass de verificación de recurso para tests E2E
  const isE2EBypass = import.meta.env?.VITE_E2E_AUTH_BYPASS === 'true';

  const check = useCallback(async () => {
    setLoading(true);
    try {
      let userEmail = "";
      try {
        const acct = instance.getActiveAccount() || accounts[0];
        userEmail = acct?.username || acct?.email || "";
      } catch {
        /* ignore */
      }
      if (!userEmail) {
        setExists(false);
        navigate("/", {
          replace: true,
          state: { modal: "resource-missing", email: "" },
        });
        return;
      }
      const { data } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .maybeSingle();
      if (!data) {
        setExists(false);
        navigate("/", {
          replace: true,
          state: { modal: "resource-missing", email: userEmail },
        });
        return;
      }
      setExists(true);
    } finally {
      setLoading(false);
    }
  }, [instance, accounts, navigate]);

  useEffect(() => {
    // En modo E2E bypass, no verificar recurso
    if (isE2EBypass) {
      setLoading(false);
      setExists(true);
      return;
    }
    check();
  }, [check, isE2EBypass]);

  if (loading) return null;
  if (!exists) return null; // ya redirigido al dashboard con modal
  return <Outlet />;
}
