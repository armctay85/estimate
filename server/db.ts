import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Lazy initialization - only create pool when first accessed
let _pool: Pool | undefined;
let _db: any;

function initPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      console.error("[db] DATABASE_URL not set - database operations will fail");
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    console.log("[db] Initializing database pool...");
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function initDb(): any {
  if (!_db) {
    _db = drizzle({ client: initPool(), schema });
  }
  return _db;
}

// Export lazy-loaded instances using getters
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const instance = initPool();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const db: ReturnType<typeof drizzle> = new Proxy({} as any, {
  get(_target, prop) {
    const instance = initDb();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
