import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import * as path from "path";
import * as fs from "fs";

// Enable connection caching in serverless / edge environments
if (neonConfig) {
  neonConfig.fetchConnectionCache = true;
}

let dbInstance: any = null;
let pgliteInstance: PGlite | null = null;

function isLiveNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  // Check if it's a real remote postgres/neon connection (contains neon.tech or host != localhost)
  return (
    url.length > 0 &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1") &&
    (url.startsWith("postgres://") || url.startsWith("postgresql://"))
  );
}

export function getDb() {
  if (dbInstance) return dbInstance;

  if (isLiveNeonConfigured()) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzleNeon(pool, { schema });
    return dbInstance;
  }

  // Local development / fallback embedded Postgres engine (PGlite)
  const dataDir = path.resolve(process.cwd(), ".data/pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!pgliteInstance) {
    pgliteInstance = new PGlite(dataDir);
  }

  dbInstance = drizzlePglite(pgliteInstance, { schema });
  return dbInstance;
}

export async function ensureDatabaseSchema() {
  const url = process.env.DATABASE_URL || "";
  if (isLiveNeonConfigured()) {
    // On Neon, migrations are managed via drizzle-kit migrate or push
    return;
  }

  // On local PGlite, run the initial migration file if tables aren't created yet
  try {
    const dataDir = path.resolve(process.cwd(), ".data/pglite");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!pgliteInstance) {
      pgliteInstance = new PGlite(dataDir);
    }

    // Check if "users" table exists
    const checkResult = await pgliteInstance.query<{ exists: string | null }>(
      "SELECT to_regclass('public.users') as exists;"
    );
    const tableExists = Boolean(checkResult.rows[0]?.exists);

    if (!tableExists) {
      const migrationDir = path.resolve(process.cwd(), "drizzle");
      const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql"));
      for (const file of files) {
        const sqlContent = fs.readFileSync(path.join(migrationDir, file), "utf8");
        const statements = sqlContent.split("--> statement-breakpoint");
        for (const stmt of statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            try {
              await pgliteInstance.query(trimmed);
            } catch (err: any) {
              // Ignore if already exists (e.g. types)
              if (!err.message?.includes("already exists")) {
                console.warn("Schema init warning:", err.message);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error ensuring database schema:", err);
  }
}

export const db = getDb();
export { schema };
