import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serve built static assets (production). No dependency on Vite so the production
 * bundle does not require the "vite" package.
 * The catch-all sends index.html for any non-API, non-file route so the
 * React SPA can handle client-side routing (e.g. /campaigns/3, /dashboard, etc.)
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const indexHtml = path.resolve(distPath, "index.html");

  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath, { index: false }));

  // SPA catch-all: every non-API GET request that doesn't match a static file
  // gets index.html so React Router / Wouter can handle client-side routing.
  // This must be registered AFTER all /api/* routes.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(503).send("App not built. Run pnpm build.");
    }
  });
}
