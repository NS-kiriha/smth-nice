import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { buildTenantCookie } from "../src/auth.js";
import { openDatabase } from "../src/db.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("tenant authentication", () => {
  it("logs in, returns /me, and logs out", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smth-nice-auth-"));
    cleanupPaths.push(directory);
    const db = await openDatabase(join(directory, "gateway.db"));

    const unitId = randomUUID();
    const tenantId = randomUUID();
    db.prepare("INSERT INTO units (id, label) VALUES (?, ?)").run(unitId, "A-101");
    db.prepare(`
      INSERT INTO tenants (id, name, username, password_hash, unit_id, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(tenantId, "Test Tenant", "test.tenant", await argon2.hash("strong-password"), unitId);

    const app = buildApp(db);
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: "test.tenant", password: "strong-password" },
    });

    expect(login.statusCode).toBe(200);
    expect(login.json()).toMatchObject({
      id: tenantId,
      username: "test.tenant",
      name: "Test Tenant",
      unit: { id: unitId, label: "A-101" },
    });

    const setCookie = login.headers["set-cookie"];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookie).toContain("tenant_session=");

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { cookie: cookie?.split(";")[0] ?? "" },
    });
    expect(me.statusCode).toBe(200);

    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: cookie?.split(";")[0] ?? "" },
    });
    expect(logout.statusCode).toBe(200);

    await app.close();
  });

  it("rejects invalid credentials", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smth-nice-auth-"));
    cleanupPaths.push(directory);
    const db = await openDatabase(join(directory, "gateway.db"));
    const app = buildApp(db);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username: "missing", password: "strong-password" },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("does not add Secure to tenant cookies when COOKIE_SECURE=false", () => {
    const previous = process.env.COOKIE_SECURE;
    process.env.COOKIE_SECURE = "false";

    try {
      const cookie = buildTenantCookie("token-value", 3600);
      expect(cookie).toContain("tenant_session=token-value");
      expect(cookie).not.toContain("Secure");
    } finally {
      if (previous === undefined) delete process.env.COOKIE_SECURE;
      else process.env.COOKIE_SECURE = previous;
    }
  });
});
