import React, { useEffect, useState } from "react";
import { useMsal } from '@azure/msal-react';

export default function LoginMicrosoft({ onLogin }) {
  const { instance, accounts } = useMsal();
  const [greetingMessage, setGreetingMessage] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const buildGreetingFromAccount = async (account) => {
    const salutation = getGreeting();
    try {
      // Try to use name from the account first (often present)
      const accountName = account?.name;
      if (accountName) {
        return `${salutation}, ${accountName}.`;
      }
      // If no name on account, try Graph
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
        account,
      });
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      const graphData = await graphResponse.json();
      const fullName = graphData.displayName || account?.username || "usuario";
      return `${salutation}, ${fullName}.`;
    } catch (e) {
      // Fallback to username
      const fallback = account?.name || account?.username || "usuario";
      return `${salutation}, ${fallback}.`;
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (accounts.length > 0 && !profileLoaded) {
        const active = instance.getActiveAccount() || accounts[0];
        const msg = await buildGreetingFromAccount(active);
        if (mounted) {
          setGreetingMessage(msg);
          setProfileLoaded(true);
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [accounts, instance, profileLoaded]);

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["User.Read"],
      });
      const email = loginResponse.account.username;

      // Set active account for future silent calls
      instance.setActiveAccount(loginResponse.account);
      // Construir saludo (usa name del account o Graph si hace falta)
      const greeting = await buildGreetingFromAccount(loginResponse.account);
      setGreetingMessage(greeting);

      console.log("✅ Logueado como:", email);
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
      ) : (
        <p className="font-bold" style={{ color: "#0097A7" }}>
          {greetingMessage || `${getGreeting()}, ${accounts[0]?.name || accounts[0]?.username || "usuario"}.`}
        </p>
      )}
    </div>
  );
}
