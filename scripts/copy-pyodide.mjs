// Copies the Pyodide runtime from node_modules into public/pyodide so Vite
// serves it as static files in dev and copies it into dist on build.
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const src = dirname(require.resolve("pyodide/package.json"));
const dest = join(root, "public", "pyodide");

const FILES = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

await mkdir(dest, { recursive: true });
let copied = 0;
for (const file of FILES) {
  const from = join(src, file);
  const to = join(dest, file);
  const a = await stat(from);
  const b = await stat(to).catch(() => null);
  if (b && b.size === a.size && b.mtimeMs >= a.mtimeMs) continue;
  await copyFile(from, to);
  copied++;
}
console.log(copied ? `pyodide: copied ${copied} runtime file(s) to public/pyodide` : "pyodide: runtime up to date");
