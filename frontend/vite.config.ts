// @ts-nocheck
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const env = loadEnv("", process.cwd(), "");

const backendHost = env.BACKEND_HOST || "http://localhost";
const backendPort = env.BACKEND_PORT || "8080";
const backendUrl = `${backendHost}:${backendPort}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Expose GOOGLE_CLIENT_ID to client-side code
    'import.meta.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
  },
  server: {
    port: Number(env.FRONTEND_PORT) || 5173,
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});


