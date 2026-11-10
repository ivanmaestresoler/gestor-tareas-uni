import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface CalendarDay {
  date: Date;
  key: string; // "2026-11-10"
  inMonth: boolean;
  isToday: boolean;
}

/**
 * Devuelve las semanas (de lunes a domingo) que cubren el mes indicado,
 * incluyendo los días de relleno del mes anterior y siguiente.
 */
export function buildMonthGrid(month: Date, today: Date): CalendarDay[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end }).map((date) => ({
    date,
    key: dayKey(date),
    inMonth: isSameMonth(date, month),
    isToday: isSameDay(date, today),
  }));
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
export const monthKey = (d: Date) => format(d, "yyyy-MM");

/** Lee "?mes=2026-11"; si no es válido, devuelve el mes actual. */
export function parseMonthParam(value: string | undefined, today: Date): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const d = parse(value, "yyyy-MM", today);
    if (isValid(d)) return startOfMonth(d);
  }
  return startOfMonth(today);
}

/** Primer y último instante visibles en la cuadrícula (para consultar la BD). */
export function gridRange(weeks: CalendarDay[][]) {
  const firstDay = weeks[0][0].date;
  const lastDay = weeks[weeks.length - 1][6].date;
  return { from: firstDay, to: addDays(lastDay, 1) };
}
