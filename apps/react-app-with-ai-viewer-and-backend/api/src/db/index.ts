import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. On Railway, reference the Postgres service " +
      "(DATABASE_URL=${{Postgres.DATABASE_URL}}); locally, copy .env.example to .env.",
  );
}

// Railway's private network URL needs no TLS; its public proxy URL does.
// `sslmode` in the URL is honoured by postgres.js, DATABASE_SSL forces it on.
const ssl = process.env.DATABASE_SSL === "true" ? ("require" as const) : undefined;

export const client = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  ...(ssl ? { ssl } : {}),
});

export const db = drizzle(client);
