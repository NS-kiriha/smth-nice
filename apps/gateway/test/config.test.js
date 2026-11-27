import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
const cleanupPaths = [];
afterEach(async () => {
    await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
describe("gateway config", () => {
    it("loads and validates a gateway configuration", async () => {
        const directory = await mkdtemp(join(tmpdir(), "smth-nice-"));
        cleanupPaths.push(directory);
        const path = join(directory, "gateway.json");
        await writeFile(path, JSON.stringify({
            host: "192.168.1.10",
            port: 3000,
            lanSubnets: ["192.168.1.0/24"],
            databasePath: "./data/gateway.db",
        }));
        await expect(loadConfig(path)).resolves.toMatchObject({
            host: "192.168.1.10",
            port: 3000,
            lanSubnets: ["192.168.1.0/24"],
        });
    });
});
//# sourceMappingURL=config.test.js.map