import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "../src/db.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("gateway database", () => {
  it("creates the initial schema and records migration 001", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smth-nice-"));
    cleanupPaths.push(directory);

    const db = await openDatabase(join(directory, "gateway.db"));

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const tableNames = tables.map((row) => row.name);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "units",
        "tenants",
        "rent_charges",
        "rent_payments",
        "maintenance_requests",
        "notices",
        "sessions",
        "audit_log",
        "sync_queue",
      ]),
    );

    const migration = db
      .prepare("SELECT version FROM schema_migrations WHERE version = ?")
      .get(1) as { version: number } | undefined;
    expect(migration?.version).toBe(1);

    db.close();
  });
});
