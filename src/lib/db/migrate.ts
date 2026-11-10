import { mkdirSync } from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

/**
 * Aplica las migraciones pendientes de la carpeta `drizzle/`.
 * Se ejecuta automáticamente al arrancar el servidor (ver src/instrumentation.ts),
 * así no hay que acordarse de lanzar ningún comando extra.
 */
export async function runMigrations() {
  mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
