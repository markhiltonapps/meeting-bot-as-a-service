import fs from "fs";
import path from "path";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db } from ".";

/**
 * drizzle/migrations sits at the api package root. Compiled code runs from
 * dist/src/db, dev code from src/db, so try both rather than trusting cwd.
 */
function resolveMigrationsFolder(): string {
  const candidates = [
    path.resolve(__dirname, "..", "..", "..", "drizzle", "migrations"), // dist/src/db
    path.resolve(__dirname, "..", "..", "drizzle", "migrations"), // src/db
    path.resolve(process.cwd(), "drizzle", "migrations"),
  ];

  const found = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "meta", "_journal.json")),
  );

  if (!found) {
    throw new Error(
      `Could not locate drizzle/migrations. Looked in:\n  ${candidates.join("\n  ")}`,
    );
  }

  return found;
}

export async function runMigrations() {
  const migrationsFolder = resolveMigrationsFolder();
  console.log(`[db]: applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("[db]: migrations applied");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[db]: migration failed", error);
      process.exit(1);
    });
}
