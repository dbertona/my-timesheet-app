import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export default function LoginMicrosoft({ onLogin }) {
  const { instance, accounts } = useMsal();

  // Auto-login SOLO en desarrollo cuando no hay sesión
  useEffect(() => {
    if (import.meta.env.DEV && (!accounts || accounts.length === 0)) {
      instance
        .loginRedirect({ scopes: ["User.Read"], prompt: "select_account" })
        .catch(() => {});
    }
  }, [accounts, instance]);

  const handleLogin = async () => {
    try {
      if (!accounts || accounts.length === 0) {
        await instance.loginRedirect({
          scopes: ["User.Read"],
          prompt: "select_account",
        });
        return;
      }
      // Si ya hay cuenta, asegurar que esté activa
      instance.setActiveAccount(accounts[0]);
      onLogin?.(accounts[0].username);
    } catch (err) {
      console.error("❌ Error en login:", err);
    }
  };

  return (
    <div>
      {!accounts || accounts.length === 0 ? (
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Iniciar sesión con Microsoft
        </button>
      ) : null}
    </div>
  );
}
