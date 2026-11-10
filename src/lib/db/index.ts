import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Cliente de base de datos (SQLite local mediante libSQL).
 *
 * Por defecto usa el archivo `data/tareas.db`. Se puede cambiar con la
 * variable DATABASE_URL (por ejemplo, para apuntar a Turso en el futuro).
 *
 * En desarrollo Next.js recarga los módulos a menudo; guardamos el cliente en
 * `globalThis` para no abrir una conexión nueva en cada recarga.
 */
const globalForDb = globalThis as unknown as { libsqlClient?: Client };

const client =
  globalForDb.libsqlClient ??
  createClient({ url: process.env.DATABASE_URL ?? "file:data/tareas.db" });

if (process.env.NODE_ENV !== "production") globalForDb.libsqlClient = client;

export const db = drizzle(client, { schema });
export { schema };
