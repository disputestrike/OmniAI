/**
 * Production-only entry point. Used by the build script so the server bundle
 * never imports "vite" (a devDependency). Dev runs server/_core/index.ts.
 */
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "../google-oauth";
import { registerEmailAuthRoutes } from "../email-auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { registerStripeRoutes } from "../stripe-routes";
import { securityHeaders, rateLimit } from "../security";
import { runMigrations } from "./migrate";

async function startServer() {
  // Ensure DB tables exist (uses DATABASE_URL or MYSQL_URL from Railway)
  await runMigrations();

  const app = express();
  const server = createServer(app);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use(securityHeaders);
  registerStripeRoutes(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerGoogleOAuthRoutes(app);
  registerEmailAuthRoutes(app);
  app.use("/api/trpc/content.generate", rateLimit({ windowMs: 60000, max: 30, keyPrefix: "ai-gen" }));
  app.use("/api/trpc/product.analyze", rateLimit({ windowMs: 60000, max: 20, keyPrefix: "ai-analyze" }));
  app.use("/api/trpc/creative.generate", rateLimit({ windowMs: 60000, max: 20, keyPrefix: "ai-creative" }));
  app.use("/api/trpc/videoAd.generate", rateLimit({ windowMs: 60000, max: 15, keyPrefix: "ai-video" }));
  app.use("/api/trpc/aiAgent.chat", rateLimit({ windowMs: 60000, max: 30, keyPrefix: "ai-chat" }));
  app.use("/api/", rateLimit({ windowMs: 60000, max: 200, keyPrefix: "api" }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  serveStatic(app);

  const port = parseInt(process.env.PORT || "3000", 10);
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
