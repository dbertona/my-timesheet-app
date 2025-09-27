/* eslint-env node */
/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { createRequire } from "module";
import { defineConfig } from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";
const require = createRequire(import.meta.url);

// Plugin para recargar cuando cambie package.json
const packageJsonWatcher = () => {
  return {
    name: 'package-json-watcher',
    configureServer(server) {
      const packageJsonPath = resolve(process.cwd(), 'package.json'); // eslint-disable-line no-undef
      let lastVersion = null;
      let isReloading = false;
      
      try {
        lastVersion = JSON.parse(readFileSync(packageJsonPath, 'utf-8')).version;
        console.log(`📦 Watching package.json version: ${lastVersion}`);
      } catch {
        console.warn('Could not read package.json version');
      }
      
      const checkVersion = () => {
        if (isReloading) return; // Evitar múltiples recargas
        
        try {
          const currentVersion = JSON.parse(readFileSync(packageJsonPath, 'utf-8')).version;
          if (lastVersion && currentVersion !== lastVersion) {
            console.log(`🔄 Version changed from ${lastVersion} to ${currentVersion}, reloading...`);
            isReloading = true;
            lastVersion = currentVersion;
            
            // Forzar recarga completa
            server.ws.send({
              type: 'full-reload'
            });
            
            // Reset flag after 2 seconds
            setTimeout(() => {
              isReloading = false;
            }, 2000);
          }
        } catch {
          // Ignore errors
        }
      };
      
      // Check every 2 seconds
      setInterval(checkVersion, 2000);
    }
  };
};

// https://vite.dev/config/
// Nota: no usamos __dirname en esta configuración

// Preferir import.meta.env en contexto ESM; fallback a process.env a través de globalThis para no romper el linter
const envBasePath =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_BASE_PATH) ||
  (globalThis && globalThis.process && globalThis.process.env && globalThis.process.env.VITE_BASE_PATH) ||
  "/"; // Debe terminar con '/'

export default defineConfig({
  plugins: [react(), packageJsonWatcher(), {
    name: 'dev-block-legacy-base-path',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url === '/my-timesheet-app' || url === '/my-timesheet-app/' || url.startsWith('/my-timesheet-app/')) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Not Found');
          return;
        }
        next();
      });
    }
  }],
  base: envBasePath,
  define: {
    __APP_VERSION__: JSON.stringify(require("./package.json").version),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(require("./package.json").version),
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor_ui: ["react-hot-toast", "react-icons"],
          tanstack: ["@tanstack/react-query", "@tanstack/react-virtual"],
          date: ["date-fns", "react-datepicker"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
  },
});
