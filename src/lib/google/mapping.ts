import { addDays, addHours, format, parseISO, subMinutes } from "date-fns";
import type { Task } from "@/lib/db/schema";
import { TYPE_LABELS } from "@/lib/tasks/labels";

/**
 * Conversión entre nuestras tareas y los formatos de Google.
 * Son funciones "puras" (sin llamadas a la red), así que se pueden testear fácilmente.
 */

export interface GoogleTaskBody {
  title: string;
  notes: string;
  due: string | null;
  status: "needsAction" | "completed";
}

export interface RemoteGoogleTask {
  id?: string | null;
  title?: string | null;
  notes?: string | null;
  due?: string | null;
  status?: string | null;
  updated?: string | null;
  deleted?: boolean | null;
}

/**
 * Tarea → Google Tasks. Google Tasks solo guarda el DÍA de vencimiento (no la hora),
 * así que la hora la ponemos en las notas. La asignatura va solo en el título
 * (para que se vea en el widget), no se repite en las notas.
 */
export function toGoogleTask(task: Task): GoogleTaskBody {
  const details = [
    TYPE_LABELS[task.type],
    task.dueDate && !task.allDay ? `Hora límite: ${format(task.dueDate, "HH:mm")}` : null,
  ].filter(Boolean);
  const notes = [details.join(" · "), task.notes, task.externalUrl].filter(Boolean).join("\n\n");

  return {
    title: task.subject ? `${task.title} · ${task.subject}` : task.title,
    notes,
    // Google espera la fecha a medianoche UTC: "2026-11-20T00:00:00.000Z"
    due: task.dueDate ? `${format(task.dueDate, "yyyy-MM-dd")}T00:00:00.000Z` : null,
    status: task.status === "hecha" ? "completed" : "needsAction",
  };
}

/** ¿Hay que actualizar la tarea remota para que coincida con la local? */
export function googleTaskDiffers(desired: GoogleTaskBody, remote: RemoteGoogleTask): boolean {
  return (
    desired.title !== (remote.title ?? "") ||
    desired.notes !== (remote.notes ?? "") ||
    (desired.due ?? null) !== (remote.due ?? null) ||
    desired.status !== remote.status
  );
}

/**
 * Si el estado (hecha/pendiente) es distinto en la app y en Google, gana el
 * cambio más reciente. Así, si marcas una tarea como hecha desde el widget del
 * móvil, la app lo recoge al sincronizar.
 */
export function resolveStatus(
  local: Pick<Task, "status" | "updatedAt">,
  remote: RemoteGoogleTask,
): "local" | "remote" | "same" {
  const remoteDone = remote.status === "completed";
  const localDone = local.status === "hecha";
  if (remoteDone === localDone) return "same";
  const remoteUpdated = remote.updated ? parseISO(remote.updated).getTime() : 0;
  return remoteUpdated > local.updatedAt.getTime() ? "remote" : "local";
}

/** Solo las entregas y exámenes con fecha van al calendario. */
export function isCalendarEligible(task: Pick<Task, "type" | "dueDate">): boolean {
  return Boolean(task.dueDate) && (task.type === "entrega" || task.type === "examen");
}

export interface CalendarEventBody {
  summary: string;
  description: string;
  colorId: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties: { private: { taskId: string } };
}

/**
 * Tarea → evento de Google Calendar.
 * - Sin hora: evento de día completo.
 * - Entrega con hora: bloque de 30 min que TERMINA a la hora límite.
 * - Examen con hora: bloque de 2 h que EMPIEZA a esa hora.
 */
export function toCalendarEvent(task: Task, timeZone: string): CalendarEventBody | null {
  if (!isCalendarEligible(task) || !task.dueDate) return null;
  const due = task.dueDate;
  const prefix = task.status === "hecha" ? "✓ " : "";
  const label = TYPE_LABELS[task.type];
  const description = [task.subject, task.notes, task.externalUrl].filter(Boolean).join("\n\n");
  const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");

  let start: CalendarEventBody["start"];
  let end: CalendarEventBody["end"];
  if (task.allDay) {
    start = { date: format(due, "yyyy-MM-dd") };
    end = { date: format(addDays(due, 1), "yyyy-MM-dd") };
  } else if (task.type === "examen") {
    start = { dateTime: fmt(due), timeZone };
    end = { dateTime: fmt(addHours(due, 2)), timeZone };
  } else {
    start = { dateTime: fmt(subMinutes(due, 30)), timeZone };
    end = { dateTime: fmt(due), timeZone };
  }

  return {
    summary: `${prefix}${label}: ${task.title}${task.subject ? ` (${task.subject})` : ""}`,
    description,
    colorId: task.type === "examen" ? "11" : "9", // 11 = rojo, 9 = azul
    start,
    end,
    extendedProperties: { private: { taskId: String(task.id) } },
  };
}
