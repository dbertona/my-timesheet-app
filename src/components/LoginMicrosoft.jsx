import React from "react";
import { useMsal } from '@azure/msal-react';

export default function LoginMicrosoft({ onLogin }) {
  const { instance, accounts } = useMsal();

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["User.Read"],
      });
      const email = loginResponse.account.username;

      // Set active account for future silent calls
      instance.setActiveAccount(loginResponse.account);

      // Logueado como usuario
      onLogin(email);
    } catch (err) {
      console.error("❌ Error en login:", err);
    }
  };

  return (
    <div>
      {accounts.length === 0 ? (
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
