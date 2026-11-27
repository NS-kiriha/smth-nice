import Database from "better-sqlite3";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type DatabaseConnection = Database.Database;

export async function openDatabase(databasePath: string): Promise<DatabaseConnection> {
  const absolutePath = resolve(databasePath);
  await mkdir(dirname(absolutePath), { recursive: true, mode: 0o700 });

  const db = new Database(absolutePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  await runMigrations(db);
  return db;
}

async function runMigrations(db: DatabaseConnection): Promise<void> {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const migrationsDir = resolve(process.cwd(), "migrations");
  let files: string[];

  try {
    files = (await readdir(migrationsDir))
      .filter((name) => /^\d+_.+\.sql$/.test(name))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return;
  }

  const isApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?");
  const recordMigration = db.prepare(
    "INSERT INTO schema_migrations (version) VALUES (?)",
  );

  for (const file of files) {
    const versionMatch = /^(\d+)_/.exec(file);
    if (!versionMatch?.[1]) continue;

    const version = Number.parseInt(versionMatch[1], 10);
    if (isApplied.get(version)) continue;

    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    const migrate = db.transaction(() => {
      db.exec(sql);
      recordMigration.run(version);
    });
    migrate.immediate();
  }
}
