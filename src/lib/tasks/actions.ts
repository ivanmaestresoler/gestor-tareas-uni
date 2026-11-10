"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { pushTask, removeFromGoogle } from "@/lib/google/sync";
import { formDataToObject, parseTaskForm } from "./validation";

/**
 * Server Actions: funciones que se ejecutan en el servidor pero se pueden
 * llamar desde los formularios y botones del navegador.
 *
 * Nota de seguridad: la app es de uso personal y en local, por eso no hay
 * autenticación. Si algún día se publica en internet, habría que comprobar
 * aquí que el usuario ha iniciado sesión.
 */

export type ActionState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

const idSchema = z.coerce.number().int().positive();

export async function saveTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseTaskForm(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: parsed.errors, message: "Revisa los campos marcados" };
  }

  const rawId = formData.get("id");
  let id: number;
  try {
    if (rawId) {
      id = idSchema.parse(rawId);
      await db
        .update(tasks)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(tasks.id, id));
    } else {
      [{ id }] = await db.insert(tasks).values(parsed.data).returning({ id: tasks.id });
    }
  } catch (error) {
    console.error("Error guardando la tarea", error);
    return { ok: false, message: "No se pudo guardar la tarea" };
  }

  syncToGoogleLater(id);
  refresh();
  return { ok: true };
}

/**
 * `after()` ejecuta el código DESPUÉS de responder al navegador: la interfaz se
 * actualiza al instante y la llamada a Google se hace en segundo plano.
 * Si falla (sin internet, por ejemplo), no pasa nada: el botón "Sincronizar"
 * lo arreglará más tarde.
 */
function syncToGoogleLater(id: number) {
  after(() => pushTask(id).catch((e) => console.error("No se pudo sincronizar con Google", e)));
}

export async function toggleTaskStatus(id: number) {
  const taskId = idSchema.parse(id);
  const [task] = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, taskId));
  if (!task) return;
  await db
    .update(tasks)
    .set({ status: task.status === "hecha" ? "pendiente" : "hecha", updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
  syncToGoogleLater(taskId);
  refresh();
}

export async function deleteTask(id: number) {
  const taskId = idSchema.parse(id);
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
  if (deleted) {
    after(() =>
      removeFromGoogle(deleted).catch((e) => console.error("No se pudo borrar en Google", e)),
    );
  }
  refresh();
}
