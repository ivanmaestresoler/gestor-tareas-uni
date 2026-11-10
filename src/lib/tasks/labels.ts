import type { TaskPriority, TaskStatus, TaskType } from "@/lib/db/schema";

/** Textos y estilos de la interfaz para cada valor del modelo. */

export const TYPE_LABELS: Record<TaskType, string> = {
  entrega: "Entrega",
  examen: "Examen",
  otro: "Otro",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  hecha: "Hecha",
};

export const TYPE_STYLES: Record<TaskType, string> = {
  entrega: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  examen: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  otro: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300",
};

/** Color del punto/indicador de cada tipo (calendario). */
export const TYPE_DOT: Record<TaskType, string> = {
  entrega: "bg-sky-500",
  examen: "bg-rose-500",
  otro: "bg-zinc-400",
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  baja: "text-zinc-500 dark:text-zinc-400",
  media: "text-amber-600 dark:text-amber-400",
  alta: "text-red-600 dark:text-red-400",
};
