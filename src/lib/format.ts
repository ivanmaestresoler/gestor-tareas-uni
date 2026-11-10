import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

/** "lun 17 nov · 23:59" o "lun 17 nov" si es de todo el día. */
export function formatDue(date: Date, allDay: boolean): string {
  const day = format(date, "EEE d MMM", { locale: es });
  return allDay ? day : `${day} · ${format(date, "HH:mm")}`;
}

/** Texto relativo: "Hoy", "Mañana", "En 3 días", "Hace 2 días". */
export function relativeDay(date: Date, now: Date): string {
  const diff = differenceInCalendarDays(date, now);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1) return `En ${diff} días`;
  return `Hace ${-diff} días`;
}

/** Valores para rellenar <input type="date"> y <input type="time">. */
export function toDateInput(date: Date | null): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function toTimeInput(date: Date | null, allDay: boolean): string {
  return date && !allDay ? format(date, "HH:mm") : "";
}
