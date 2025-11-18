// @ts-nocheck
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const env = loadEnv("", process.cwd());

const mergedEnv = {
  ...env,
  ...process.env,
};

const backendHost = mergedEnv.BACKEND_HOST;
const backendPort = mergedEnv.BACKEND_PORT;
const backendUrl = `${backendHost}:${backendPort}`;

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === "production" || command === "build";
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.GOOGLE_CLIENT_ID": JSON.stringify(mergedEnv.GOOGLE_CLIENT_ID),
      // Disable HMR in production builds to prevent postMessage errors
      // This prevents Vite's HMR client from trying to use postMessage
      ...(isProduction && { "import.meta.hot": "undefined" }),
    },
    server: {
      port: Number(mergedEnv.FRONTEND_PORT),
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // Explicitly disable sourcemaps and ensure production mode
      sourcemap: false,
      // Ensure we're building in production mode
      minify: "esbuild",
    },
  };
});
