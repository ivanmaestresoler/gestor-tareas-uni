import { endOfDay, startOfDay } from "date-fns";
import { TASK_TYPES, type Task, type TaskType } from "@/lib/db/schema";

export type StatusFilter = "pendientes" | "hechas" | "todas";

export interface TaskFilters {
  q?: string;
  type?: TaskType;
  status: StatusFilter;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lee los filtros desde la URL (?q=...&tipo=...), ignorando valores no válidos. */
export function parseFilters(params: SearchParams): TaskFilters {
  const type = first(params.tipo);
  const status = first(params.estado);
  return {
    q: first(params.q)?.trim() || undefined,
    type: TASK_TYPES.includes(type as TaskType) ? (type as TaskType) : undefined,
    status: status === "hechas" || status === "todas" ? status : "pendientes",
  };
}

/** Quita acentos y pasa a minúsculas para buscar sin importar tildes. */
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function applyFilters(tasks: Task[], f: TaskFilters): Task[] {
  const q = f.q ? normalize(f.q) : undefined;
  return tasks.filter((t) => {
    if (f.status === "pendientes" && t.status !== "pendiente") return false;
    if (f.status === "hechas" && t.status !== "hecha") return false;
    if (f.type && t.type !== f.type) return false;
    if (q) {
      const haystack = normalize(`${t.title} ${t.subject ?? ""} ${t.notes ?? ""}`);
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Orden: por fecha ascendente; a igual fecha (o sin fecha), por título. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const da = a.dueDate?.getTime() ?? Infinity;
    const dbt = b.dueDate?.getTime() ?? Infinity;
    if (da !== dbt) return da - dbt;
    return a.title.localeCompare(b.title, "es");
  });
}

export interface TaskGroups {
  overdue: Task[];
  upcoming: Task[];
  noDate: Task[];
  done: Task[];
}

/**
 * Reparte las tareas en secciones para la vista de lista.
 * Una tarea "de todo el día" no está atrasada hasta que termina ese día.
 */
export function groupTasks(tasks: Task[], now: Date): TaskGroups {
  const groups: TaskGroups = { overdue: [], upcoming: [], noDate: [], done: [] };
  for (const t of sortTasks(tasks)) {
    if (t.status === "hecha") groups.done.push(t);
    else if (!t.dueDate) groups.noDate.push(t);
    else if (isOverdue(t, now)) groups.overdue.push(t);
    else groups.upcoming.push(t);
  }
  return groups;
}

export function isOverdue(t: Pick<Task, "dueDate" | "allDay" | "status">, now: Date): boolean {
  if (!t.dueDate || t.status === "hecha") return false;
  const deadline = t.allDay ? endOfDay(t.dueDate) : t.dueDate;
  return deadline.getTime() < now.getTime();
}

export interface TaskStats {
  pending: number;
  thisWeek: number;
  noDate: number;
  overdue: number;
}

export function computeStats(tasks: Task[], now: Date): TaskStats {
  const today = startOfDay(now).getTime();
  const weekEnd = endOfDay(new Date(today + 6 * 24 * 60 * 60 * 1000)).getTime();
  const pending = tasks.filter((t) => t.status === "pendiente");
  return {
    pending: pending.length,
    noDate: pending.filter((t) => !t.dueDate).length,
    overdue: pending.filter((t) => isOverdue(t, now)).length,
    thisWeek: pending.filter((t) => {
      if (!t.dueDate || isOverdue(t, now)) return false;
      const d = t.dueDate.getTime();
      return d >= today && d <= weekEnd;
    }).length,
  };
}
