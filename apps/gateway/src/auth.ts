import * as argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DatabaseConnection } from "./db.js";

export const TENANT_COOKIE = "tenant_session";
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

export interface TenantIdentity {
  id: string;
  username: string;
  name: string;
  unit: { id: string; label: string } | null;
}

interface TenantRow {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  unit_id: string | null;
  unit_label: string | null;
  active: number;
  failed_login_count: number;
  locked_until: string | null;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function readCookie(request: FastifyRequest, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return undefined;
}

function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.header(
    "set-cookie",
    `${TENANT_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/v1; Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  );
}

export async function loginTenant(
  db: DatabaseConnection,
  username: string,
  password: string,
  reply: FastifyReply,
): Promise<TenantIdentity | null> {
  const normalizedUsername = username.trim().toLowerCase();
  const row = db.prepare(`
    SELECT t.id, t.username, t.name, t.password_hash, t.unit_id,
           u.label AS unit_label, t.active, t.failed_login_count, t.locked_until
    FROM tenants t
    LEFT JOIN units u ON u.id = t.unit_id
    WHERE lower(t.username) = ?
  `).get(normalizedUsername) as TenantRow | undefined;

  if (!row || row.active !== 1) return null;

  if (row.locked_until && Date.parse(row.locked_until) > Date.now()) return null;

  let passwordMatches = false;
  try {
    passwordMatches = await argon2.verify(row.password_hash, password);
  } catch {
    passwordMatches = false;
  }

  if (!passwordMatches) {
    const failedCount = row.failed_login_count + 1;
    const lockUntil = failedCount >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOCK_MS).toISOString()
      : null;

    db.prepare(`
      UPDATE tenants
      SET failed_login_count = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(failedCount, lockUntil, row.id);

    return null;
  }

  db.prepare(`
    UPDATE tenants
    SET failed_login_count = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(row.id);

  const token = randomUUID() + randomUUID().replaceAll("-", "");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MS).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, tenant_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(randomUUID(), row.id, hashToken(token), expiresAt);

  setSessionCookie(reply, token);

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    unit: row.unit_id && row.unit_label
      ? { id: row.unit_id, label: row.unit_label }
      : null,
  };
}

export async function getTenantFromRequest(
  db: DatabaseConnection,
  request: FastifyRequest,
): Promise<TenantIdentity | null> {
  const token = readCookie(request, TENANT_COOKIE);
  if (!token) return null;

  const row = db.prepare(`
    SELECT s.expires_at, s.revoked_at, t.id, t.username, t.name,
           t.unit_id, t.active, u.label AS unit_label
    FROM sessions s
    JOIN tenants t ON t.id = s.tenant_id
    LEFT JOIN units u ON u.id = t.unit_id
    WHERE s.token_hash = ?
  `).get(hashToken(token)) as {
    expires_at: string;
    revoked_at: string | null;
    id: string;
    username: string;
    name: string;
    unit_id: string | null;
    unit_label: string | null;
    active: number;
  } | undefined;

  if (!row || row.revoked_at || row.active !== 1) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    unit: row.unit_id && row.unit_label
      ? { id: row.unit_id, label: row.unit_label }
      : null,
  };
}

export async function revokeTenantSession(
  db: DatabaseConnection,
  request: FastifyRequest,
): Promise<void> {
  const token = readCookie(request, TENANT_COOKIE);
  if (!token) return;

  db.prepare(`
    UPDATE sessions
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE token_hash = ? AND revoked_at IS NULL
  `).run(hashToken(token));
}
