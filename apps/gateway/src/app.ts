import Fastify, { type FastifyInstance } from "fastify";
import type { DatabaseConnection } from "./db.js";
import { registerAuthRoutes } from "./auth-routes.js";

export function buildApp(db: DatabaseConnection): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/api/v1/health", async () => ({
    status: "ok",
    database: db.open,
  }));

  app.addHook("onClose", async () => {
    db.close();
  });

  registerAuthRoutes(app, db); // Register the authentication routes

  return app;
}
