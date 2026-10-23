import { defineConfig, type Plugin } from "vite";

// Cross-origin isolation lets the page share a SharedArrayBuffer with the
// Python worker, which Pyodide uses for keyboard interrupts (the Stop button).
const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

function crossOriginIsolation(): Plugin {
  const apply = (_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    for (const [k, v] of Object.entries(isolationHeaders)) res.setHeader(k, v);
    next();
  };
  return {
    name: "cross-origin-isolation",
    configureServer(server) {
      server.middlewares.use(apply);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apply);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [crossOriginIsolation()],
  server: { headers: isolationHeaders, port: 5190 },
  preview: { headers: isolationHeaders, port: 5191 },
  // Pyodide loads its runtime files (copied to public/pyodide) at run time.
  optimizeDeps: { exclude: ["pyodide"] },
  worker: { format: "es" },
  build: { target: "es2022", chunkSizeWarningLimit: 2000 },
});
