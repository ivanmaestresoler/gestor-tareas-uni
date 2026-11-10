/**
 * Next.js ejecuta `register()` una sola vez al arrancar el servidor.
 * Lo usamos para crear/actualizar la base de datos automáticamente.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
  }
}
