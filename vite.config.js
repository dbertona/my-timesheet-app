/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Nota: no usamos __dirname en esta configuración

export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(require("./package.json").version),
  },
  server: {
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
