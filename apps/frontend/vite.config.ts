import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  optimizeDeps: {
    include: [
      "@mantine/core",
      "@mantine/form",
      "@mantine/hooks",
      "@tanstack/react-query",
      "@tanstack/react-router",
      "i18next",
      "openapi-fetch",
      "openapi-react-query",
      "react-i18next",
    ],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        xfwd: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
