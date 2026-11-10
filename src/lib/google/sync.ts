import { calendar, type calendar_v3 } from "@googleapis/calendar";
import { tasks as tasksApi, type tasks_v1 } from "@googleapis/tasks";
import { eq } from "drizzle-orm";
import type { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { tasks, type Task } from "@/lib/db/schema";
import { getSettings, SETTING_KEYS, setSettings } from "@/lib/settings";
import { getAuthorizedClient } from "./auth";
import {
  fromGoogleTask,
  googleTaskDiffers,
  isCalendarEligible,
  resolveStatus,
  toCalendarEvent,
  toGoogleTask,
  type RemoteGoogleTask,
} from "./mapping";

const LIST_NAME = "Universidad";
const CALENDAR_NAME = "Universidad";

export interface SyncSummary {
  tasksCreated: number;
  tasksUpdated: number;
  completedFromGoogle: number;
  importedFromGoogle: number;
  eventsUpserted: number;
  eventsDeleted: number;
}

type Apis = { tasks: tasks_v1.Tasks; calendar: calendar_v3.Calendar };

function apisFor(auth: OAuth2Client): Apis {
  return {
    tasks: tasksApi({ version: "v1", auth }),
    calendar: calendar({ version: "v3", auth }),
  };
}

const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** ¿Es un error 404/410 (el recurso ya no existe en Google)? */
function isNotFound(error: unknown): boolean {
  const e = error as { status?: number; code?: number | string; response?: { status?: number } };
  const status = e?.status ?? e?.response?.status ?? Number(e?.code);
  return status === 404 || status === 410;
}

async function syncOptions() {
  const s = await getSettings();
  const lastSync = s[SETTING_KEYS.googleLastSync];
  return {
    tasks: s[SETTING_KEYS.googleSyncTasks] !== "0",
    calendar: s[SETTING_KEYS.googleSyncCalendar] !== "0",
    taskListId: s[SETTING_KEYS.googleTaskListId],
    calendarId: s[SETTING_KEYS.googleCalendarId],
    lastSync: lastSync ? new Date(lastSync) : null,
  };
}

/** Busca (o crea) la lista "Universidad" en Google Tasks. */
async function ensureTaskList(api: tasks_v1.Tasks, savedId?: string): Promise<string> {
  if (savedId) {
    try {
      await api.tasklists.get({ tasklist: savedId });
      return savedId;
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }
  const { data } = await api.tasklists.list({ maxResults: 100 });
  let id = data.items?.find((l) => l.title === LIST_NAME)?.id;
  if (!id) id = (await api.tasklists.insert({ requestBody: { title: LIST_NAME } })).data.id!;
  await setSettings({ [SETTING_KEYS.googleTaskListId]: id });
  return id;
}

/** Busca (o crea) el calendario "Universidad". */
async function ensureCalendar(api: calendar_v3.Calendar, savedId?: string): Promise<string> {
  if (savedId) {
    try {
      await api.calendars.get({ calendarId: savedId });
      return savedId;
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }
  const { data } = await api.calendars.insert({
    requestBody: { summary: CALENDAR_NAME, timeZone: localTimeZone() },
  });
  await setSettings({ [SETTING_KEYS.googleCalendarId]: data.id! });
  return data.id!;
}

async function listRemoteTasks(api: tasks_v1.Tasks, tasklist: string) {
  const all: tasks_v1.Schema$Task[] = [];
  let pageToken: string | undefined;
  do {
    const { data } = await api.tasks.list({
      tasklist,
      showCompleted: true,
      showHidden: true,
      maxResults: 100,
      pageToken,
    });
    all.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
  return all;
}

/** Crea o actualiza una tarea en Google Tasks. Devuelve el id remoto. */
async function upsertGoogleTask(
  api: tasks_v1.Tasks,
  tasklist: string,
  task: Task,
  remote?: RemoteGoogleTask,
): Promise<{ id: string; changed: "created" | "updated" | "none" }> {
  const body = toGoogleTask(task);
  const requestBody = { ...body, completed: body.status === "completed" ? undefined : null };
  if (task.googleTaskId && remote) {
    if (!googleTaskDiffers(body, remote)) return { id: task.googleTaskId, changed: "none" };
    await api.tasks.patch({ tasklist, task: task.googleTaskId, requestBody });
    return { id: task.googleTaskId, changed: "updated" };
  }
  if (task.googleTaskId && !remote) {
    // Lo tenemos enlazado pero no sabemos si existe: intentamos actualizarlo.
    try {
      await api.tasks.patch({ tasklist, task: task.googleTaskId, requestBody });
      return { id: task.googleTaskId, changed: "updated" };
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }
  const { data } = await api.tasks.insert({ tasklist, requestBody });
  return { id: data.id!, changed: "created" };
}

/** Crea, actualiza o borra el evento del calendario de una tarea. */
async function upsertCalendarEvent(
  api: calendar_v3.Calendar,
  calendarId: string,
  task: Task,
): Promise<{ eventId: string | null; changed: "upserted" | "deleted" | "none" }> {
  const event = toCalendarEvent(task, localTimeZone());
  if (!event) {
    if (!task.googleEventId) return { eventId: null, changed: "none" };
    try {
      await api.events.delete({ calendarId, eventId: task.googleEventId });
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
    return { eventId: null, changed: "deleted" };
  }
  if (task.googleEventId) {
    try {
      await api.events.update({ calendarId, eventId: task.googleEventId, requestBody: event });
      return { eventId: task.googleEventId, changed: "upserted" };
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }
  const { data } = await api.events.insert({ calendarId, requestBody: event });
  return { eventId: data.id!, changed: "upserted" };
}

/**
 * Sincronización completa (botón "Sincronizar ahora"):
 * 1. Google Tasks: sube/actualiza todas las tareas, recoge las que marcaste como
 *    hechas en el móvil e importa las que creaste directamente en Google Tasks.
 * 2. Google Calendar: crea/actualiza eventos de entregas y exámenes con fecha.
 */
export async function syncAll(): Promise<SyncSummary> {
  const auth = await getAuthorizedClient();
  if (!auth) throw new Error("No hay ninguna cuenta de Google conectada");
  const api = apisFor(auth);
  const opts = await syncOptions();
  const startedAt = new Date();
  const summary: SyncSummary = {
    tasksCreated: 0,
    tasksUpdated: 0,
    completedFromGoogle: 0,
    importedFromGoogle: 0,
    eventsUpserted: 0,
    eventsDeleted: 0,
  };

  if (opts.tasks) {
    const tasklist = await ensureTaskList(api.tasks, opts.taskListId);
    const remote = await listRemoteTasks(api.tasks, tasklist);
    const remoteById = new Map(remote.filter((r) => r.id).map((r) => [r.id!, r]));
    const local = await db.select().from(tasks);
    const linked = new Set<string>();

    for (let task of local) {
      const r = task.googleTaskId ? remoteById.get(task.googleTaskId) : undefined;
      if (task.googleTaskId) linked.add(task.googleTaskId);

      // 1) El estado (hecha/pendiente) lo decide el cambio más reciente.
      if (r && resolveStatus(task, r) === "remote") {
        const status = r.status === "completed" ? ("hecha" as const) : ("pendiente" as const);
        [task] = await db
          .update(tasks)
          .set({ status, updatedAt: new Date() })
          .where(eq(tasks.id, task.id))
          .returning();
        if (status === "hecha") summary.completedFromGoogle++;
      }

      // 2) El resto de datos (título, fecha, notas) los manda la app.
      const res = await upsertGoogleTask(api.tasks, tasklist, task, r);
      if (res.changed === "created") summary.tasksCreated++;
      if (res.changed === "updated") summary.tasksUpdated++;
      if (res.id !== task.googleTaskId) {
        await db.update(tasks).set({ googleTaskId: res.id }).where(eq(tasks.id, task.id));
      }
      linked.add(res.id);
    }

    // 3) Tareas creadas directamente en Google Tasks → las importamos a la app.
    for (const r of remote) {
      if (!r.id || linked.has(r.id) || r.deleted || !r.title?.trim()) continue;
      await db.insert(tasks).values(fromGoogleTask(r));
      summary.importedFromGoogle++;
    }
  }

  if (opts.calendar) {
    const calendarId = await ensureCalendar(api.calendar, opts.calendarId);
    const calendarChanged = calendarId !== opts.calendarId;
    const local = await db.select().from(tasks);
    for (const task of local) {
      // Solo tocamos lo que ha cambiado desde la última sincronización.
      const stale =
        calendarChanged ||
        !opts.lastSync ||
        task.updatedAt > opts.lastSync ||
        (!task.googleEventId && isCalendarEligible(task));
      if (!stale) continue;
      const res = await upsertCalendarEvent(
        api.calendar,
        calendarId,
        calendarChanged ? { ...task, googleEventId: null } : task,
      );
      if (res.changed === "upserted") summary.eventsUpserted++;
      if (res.changed === "deleted") summary.eventsDeleted++;
      if (res.eventId !== task.googleEventId) {
        await db.update(tasks).set({ googleEventId: res.eventId }).where(eq(tasks.id, task.id));
      }
    }
  }

  await setSettings({ [SETTING_KEYS.googleLastSync]: startedAt.toISOString() });
  return summary;
}

/**
 * Sincroniza UNA tarea justo después de crearla o editarla en la app,
 * para que el widget esté al día sin tener que pulsar "Sincronizar".
 */
export async function pushTask(taskId: number): Promise<void> {
  const auth = await getAuthorizedClient();
  if (!auth) return;
  const api = apisFor(auth);
  const opts = await syncOptions();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) return;

  if (opts.tasks) {
    const tasklist = await ensureTaskList(api.tasks, opts.taskListId);
    const { id } = await upsertGoogleTask(api.tasks, tasklist, task);
    if (id !== task.googleTaskId) {
      await db.update(tasks).set({ googleTaskId: id }).where(eq(tasks.id, task.id));
    }
  }
  if (opts.calendar) {
    const calendarId = await ensureCalendar(api.calendar, opts.calendarId);
    const { eventId } = await upsertCalendarEvent(api.calendar, calendarId, task);
    if (eventId !== task.googleEventId) {
      await db.update(tasks).set({ googleEventId: eventId }).where(eq(tasks.id, task.id));
    }
  }
}

/** Borra de Google la tarea y el evento de una tarea que se ha eliminado en la app. */
export async function removeFromGoogle(
  task: Pick<Task, "googleTaskId" | "googleEventId">,
): Promise<void> {
  if (!task.googleTaskId && !task.googleEventId) return;
  const auth = await getAuthorizedClient();
  if (!auth) return;
  const api = apisFor(auth);
  const opts = await syncOptions();
  const ignoreMissing = (error: unknown) => {
    if (!isNotFound(error)) throw error;
  };
  if (task.googleTaskId && opts.taskListId) {
    await api.tasks.tasks
      .delete({ tasklist: opts.taskListId, task: task.googleTaskId })
      .catch(ignoreMissing);
  }
  if (task.googleEventId && opts.calendarId) {
    await api.calendar.events
      .delete({ calendarId: opts.calendarId, eventId: task.googleEventId })
      .catch(ignoreMissing);
  }
}
