"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
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
  try {
    if (rawId) {
      const id = idSchema.parse(rawId);
      await db
        .update(tasks)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(tasks.id, id));
    } else {
      await db.insert(tasks).values(parsed.data);
    }
  } catch (error) {
    console.error("Error guardando la tarea", error);
    return { ok: false, message: "No se pudo guardar la tarea" };
  }

  refresh();
  return { ok: true };
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
  refresh();
}

export async function deleteTask(id: number) {
  const taskId = idSchema.parse(id);
  await db.delete(tasks).where(eq(tasks.id, taskId));
  refresh();
}
