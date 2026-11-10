/**
 * Rellena la base de datos con tareas de ejemplo (útil para probar y para las capturas).
 *
 *   npm run db:seed            -> solo si la base de datos está vacía
 *   npm run db:seed -- --reset -> borra todas las tareas y vuelve a crearlas
 */
import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { tasks, type NewTask } from "../src/lib/db/schema.ts";

mkdirSync("data", { recursive: true });
const db = drizzle(createClient({ url: process.env.DATABASE_URL ?? "file:data/tareas.db" }));
await migrate(db, { migrationsFolder: "drizzle" });

const reset = process.argv.includes("--reset");
const existing = await db.$count(tasks);
if (existing > 0 && !reset) {
  console.log(`Ya hay ${existing} tareas. Usa "npm run db:seed -- --reset" para reemplazarlas.`);
  process.exit(0);
}
if (reset) await db.delete(tasks);

/** Fecha a N días de hoy, a la hora indicada (o de todo el día). */
function inDays(n: number, time?: string): { dueDate: Date; allDay: boolean } {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const [h, m] = (time ?? "00:00").split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return { dueDate: d, allDay: !time };
}

const sample: NewTask[] = [
  { title: "Práctica 3: árboles AVL", subject: "Estructuras de Datos", type: "entrega", priority: "alta", ...inDays(2, "23:59"), notes: "Entregar .zip con el código y la memoria en PDF." },
  { title: "Examen parcial", subject: "Cálculo II", type: "examen", priority: "alta", ...inDays(6, "09:00"), notes: "Temas 1-4. Aula 2.03." },
  { title: "Cuestionario tema 5", subject: "Bases de Datos", type: "entrega", priority: "media", ...inDays(-1, "23:59") },
  { title: "Informe de laboratorio 2", subject: "Física", type: "entrega", priority: "media", ...inDays(9) },
  { title: "Presentación del proyecto final", subject: "Ingeniería del Software", type: "otro", priority: "media", ...inDays(14, "12:00") },
  { title: "Examen final", subject: "Estructuras de Datos", type: "examen", priority: "alta", ...inDays(24, "16:00") },
  { title: "Ejercicios voluntarios de integrales", subject: "Cálculo II", type: "entrega", priority: "baja", notes: "Suben nota hasta 0,5 puntos. No tienen fecha en el aula virtual." },
  { title: "Diario de aprendizaje", subject: "Ingeniería del Software", type: "entrega", priority: "media", notes: "Se va rellenando durante el cuatrimestre." },
  { title: "Leer artículo sobre normalización", subject: "Bases de Datos", type: "otro", priority: "baja" },
  { title: "Práctica 2: listas enlazadas", subject: "Estructuras de Datos", type: "entrega", priority: "media", status: "hecha", ...inDays(-5, "23:59") },
];

await db.insert(tasks).values(sample);
console.log(`✔ Creadas ${sample.length} tareas de ejemplo.`);
