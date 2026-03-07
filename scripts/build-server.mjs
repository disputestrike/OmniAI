#!/usr/bin/env node
/**
 * Production server build. Entry is index.prod.ts only; "vite" is explicitly
 * external so the server bundle never requires it at runtime.
 */
import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const entry = path.join(root, "server/_core/index.prod.ts");
const outfile = path.join(root, "dist/index.js");

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
  packages: "external",
  external: ["vite", "vite/config"],
  logLevel: "info",
});

console.log("Server bundle written to", outfile);
