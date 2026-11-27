import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("gateway app", () => {
  it("reports health on the versioned API", async () => {
    const directory = await mkdtemp(join(tmpdir(), "smth-nice-"));
    cleanupPaths.push(directory);

    const db = await openDatabase(join(directory, "gateway.db"));
    const app = buildApp(db);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: true });

    await app.close();
  });
});
