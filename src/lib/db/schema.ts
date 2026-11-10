import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const TASK_TYPES = ["entrega", "examen", "otro"] as const;
export const TASK_PRIORITIES = ["baja", "media", "alta"] as const;
export const TASK_STATUSES = ["pendiente", "hecha"] as const;
export const TASK_SOURCES = ["manual", "moodle"] as const;

/**
 * Tabla principal de tareas.
 *
 * - `dueDate` es opcional: las tareas sin fecha se muestran en la sección "Sin fecha".
 * - `allDay` indica que la tarea tiene día pero no hora concreta.
 * - `source` + `externalId` permiten identificar tareas importadas (Moodle, fase 2)
 *   para no duplicarlas al sincronizar.
 * - `googleEventId` guardará el id del evento en Google Calendar (fase 3).
 */
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subject: text("subject"),
  type: text("type", { enum: TASK_TYPES }).notNull().default("entrega"),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  priority: text("priority", { enum: TASK_PRIORITIES }).notNull().default("media"),
  status: text("status", { enum: TASK_STATUSES }).notNull().default("pendiente"),
  notes: text("notes"),
  source: text("source", { enum: TASK_SOURCES }).notNull().default("manual"),
  externalId: text("external_id").unique(),
  externalUrl: text("external_url"),
  googleEventId: text("google_event_id"),
  googleTaskId: text("google_task_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * Ajustes de la app en formato clave/valor (conexión con Google, opciones de
 * sincronización...). Al ser una app de un solo usuario no hace falta más.
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskType = (typeof TASK_TYPES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
