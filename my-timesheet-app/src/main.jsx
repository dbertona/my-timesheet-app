import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { msalConfig } from "./authConfig";
import "./index.css";
import { router } from "./router";

// Silenciar logs informativos de Vite en desarrollo (HMR)
if (import.meta.env?.DEV) {
  const _log = console.log;
  console.log = (...args) => {
    try {
      if (typeof args[0] === "string" && args[0].startsWith("[vite]")) {
        return;
      }
    } catch {
      /* ignore */
    }
    _log(...args);
  };
}

// Singleton de MSAL para evitar múltiples inicializaciones en HMR
const msalInstance = (() => {
  const w = window;
  if (w.__MSAL__ && w.__MSAL__ instanceof PublicClientApplication) {
    return w.__MSAL__;
  }
  const inst = new PublicClientApplication(msalConfig);
  try { w.__MSAL__ = inst; } catch { /* ignore */ }
  return inst;
})();
const root = document.getElementById("root");

const queryClient = new QueryClient();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <Toaster position="top-center" gutter={8} />
        {import.meta.env.DEV ? (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        ) : null}
      </QueryClientProvider>
    </MsalProvider>
  </React.StrictMode>
);
