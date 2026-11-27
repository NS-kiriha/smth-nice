import type { FastifyInstance } from "fastify";
import { loginRequestSchema, tenantMeSchema } from "@smth-nice/shared";
import type { DatabaseConnection } from "./db.js";
import {
  buildTenantCookie,
  getTenantFromRequest,
  loginTenant,
  revokeTenantSession,
} from "./auth.js";

export function registerAuthRoutes(app: FastifyInstance, db: DatabaseConnection): void {
  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login request",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.map(String).join("."),
            message: issue.message,
          })),
        },
      });
    }

    const tenant = await loginTenant(db, parsed.data.username, parsed.data.password, reply);
    if (!tenant) {
      return reply.code(401).send({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      });
    }

    return tenantMeSchema.parse(tenant);
  });

  app.get("/api/v1/me", async (request, reply) => {
    const tenant = await getTenantFromRequest(db, request);
    if (!tenant) {
      return reply.code(401).send({
        error: { code: "UNAUTHENTICATED", message: "A valid tenant session is required" },
      });
    }

    return tenantMeSchema.parse(tenant);
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    await revokeTenantSession(db, request);
    reply.header(
      "set-cookie",
      buildTenantCookie("", 0),
    );
    return { ok: true };
  });
}
