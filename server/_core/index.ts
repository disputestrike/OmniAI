import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "../google-oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeRoutes } from "../stripe-routes";
import { securityHeaders, rateLimit } from "../security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Health check for Railway/containers (no tRPC, no DB) — use this as Healthcheck Path in Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Security headers on all responses
  app.use(securityHeaders);
  // Stripe webhook must be registered BEFORE body parsers (needs raw body)
  registerStripeRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Google OAuth only (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET required)
  registerGoogleOAuthRoutes(app);
  // Rate limit AI-heavy endpoints (60 requests per minute per IP)
  app.use("/api/trpc/content.generate", rateLimit({ windowMs: 60000, max: 30, keyPrefix: "ai-gen" }));
  app.use("/api/trpc/product.analyze", rateLimit({ windowMs: 60000, max: 20, keyPrefix: "ai-analyze" }));
  app.use("/api/trpc/creative.generate", rateLimit({ windowMs: 60000, max: 20, keyPrefix: "ai-creative" }));
  app.use("/api/trpc/videoAd.generate", rateLimit({ windowMs: 60000, max: 15, keyPrefix: "ai-video" }));
  app.use("/api/trpc/aiAgent.chat", rateLimit({ windowMs: 60000, max: 30, keyPrefix: "ai-chat" }));
  // General API rate limit (200 requests per minute per IP)
  app.use("/api/", rateLimit({ windowMs: 60000, max: 200, keyPrefix: "api" }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : undefined;

  // In production (e.g. Railway), use PORT as-is and bind to 0.0.0.0 so the container accepts external traffic
  if (process.env.NODE_ENV === "production") {
    server.listen(port, host, () => {
      console.log(`Server running on http://0.0.0.0:${port}/`);
    });
  } else {
    const actualPort = await findAvailablePort(port);
    if (actualPort !== port) {
      console.log(`Port ${port} is busy, using port ${actualPort} instead`);
    }
    server.listen(actualPort, () => {
      console.log(`Server running on http://localhost:${actualPort}/`);
    });
  }
}

startServer().catch(console.error);
