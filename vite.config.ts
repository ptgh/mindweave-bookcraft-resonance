import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    // Force a single React instance (fixes "dispatcher.useState" / invalid hook call)
    alias: {
      "@": path.resolve(__dirname, "./src"),

      // React core (cover common subpaths some deps use)
      react: path.resolve(__dirname, "node_modules/react"),
      "react/index.js": path.resolve(__dirname, "node_modules/react/index.js"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
      "react/cjs/react.development.js": path.resolve(
        __dirname,
        "node_modules/react/cjs/react.development.js",
      ),
      "react/cjs/react.production.min.js": path.resolve(
        __dirname,
        "node_modules/react/cjs/react.production.min.js",
      ),

      // ReactDOM renderer (and subpaths)
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-dom/index.js": path.resolve(__dirname, "node_modules/react-dom/index.js"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
      "react-dom/server": path.resolve(__dirname, "node_modules/react-dom/server"),
      "react-dom/cjs/react-dom.development.js": path.resolve(
        __dirname,
        "node_modules/react-dom/cjs/react-dom.development.js",
      ),
      "react-dom/cjs/react-dom.production.min.js": path.resolve(
        __dirname,
        "node_modules/react-dom/cjs/react-dom.production.min.js",
      ),
    },

    // Prevent duplicate React instances pulled in by deps
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Avoid pre-bundling React into a separate optimized chunk (can lead to duplicate instances)
    exclude: ["react", "react-dom", "react-dom/client"],
  },
}));
