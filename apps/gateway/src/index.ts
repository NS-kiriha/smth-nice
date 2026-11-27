import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const db = await openDatabase(config.databasePath);
  const app = buildApp(db);

  await app.listen({ host: config.host, port: config.port });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "gateway shutting down");
    await app.close();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
