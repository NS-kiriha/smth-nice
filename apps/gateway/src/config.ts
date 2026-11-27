import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const configSchema = z.object({
  host: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
  lanSubnets: z.array(z.string().trim().min(1)).min(1),
  databasePath: z.string().trim().min(1),
  corsOrigin: z.string().trim().optional(),
});

export type GatewayConfig = z.infer<typeof configSchema>;

export async function loadConfig(configPath = "gateway.config.json"): Promise<GatewayConfig> {
  const absolutePath = resolve(configPath);
  const text = await readFile(absolutePath, "utf8");
  return configSchema.parse(JSON.parse(text));
}
