import { and, asc, gte, isNotNull, lt } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

/**
 * Lecturas de la base de datos. Llamamos a `connection()` para indicar a Next.js
 * que estos datos deben leerse en cada petición (no prerenderizarse al compilar).
 */

export async function getAllTasks() {
  await connection();
  return db.select().from(tasks).orderBy(asc(tasks.dueDate));
}

export async function getTasksBetween(from: Date, to: Date) {
  await connection();
  return db
    .select()
    .from(tasks)
    .where(and(isNotNull(tasks.dueDate), gte(tasks.dueDate, from), lt(tasks.dueDate, to)))
    .orderBy(asc(tasks.dueDate));
}

/** Lista de asignaturas distintas, para los filtros y el autocompletado. */
export function getSubjects(all: { subject: string | null }[]): string[] {
  return [...new Set(all.map((t) => t.subject).filter((s): s is string => Boolean(s)))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}
