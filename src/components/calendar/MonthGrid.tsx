"use client";

import type { Task } from "@/lib/db/schema";
import type { CalendarDay } from "@/lib/calendar";
import { TYPE_DOT, TYPE_STYLES } from "@/lib/tasks/labels";
import { useTaskDialog } from "@/components/tasks/TaskDialogProvider";
import { format } from "date-fns";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS = 3;

/**
 * Cuadrícula mensual. En pantallas grandes muestra el título de cada tarea;
 * en el móvil, solo puntos de color (la lista del mes va debajo).
 * Pulsar un día vacío crea una tarea en esa fecha.
 */
export function MonthGrid({
  weeks,
  tasksByDay,
}: {
  weeks: CalendarDay[][];
  tasksByDay: Record<string, Task[]>;
}) {
  const { openNew, openEdit } = useTaskDialog();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-7 border-b border-zinc-200 text-center text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          const dayTasks = tasksByDay[day.key] ?? [];
          const extra = dayTasks.length - MAX_CHIPS;
          return (
            <div
              key={day.key}
              onClick={() => openNew({ date: day.key })}
              className={`group relative min-h-16 cursor-pointer border-zinc-100 p-1 transition hover:bg-indigo-50/50 sm:min-h-28 sm:p-1.5 dark:border-zinc-800 dark:hover:bg-indigo-500/5 ${
                i % 7 !== 6 ? "border-r" : ""
              } ${i < weeks.flat().length - 7 ? "border-b" : ""} ${
                day.inMonth ? "" : "bg-zinc-50/80 text-zinc-400 dark:bg-zinc-950/40 dark:text-zinc-600"
              }`}
            >
              <span
                className={`mb-1 grid size-6 place-items-center rounded-full text-xs font-medium sm:size-7 sm:text-sm ${
                  day.isToday ? "bg-indigo-600 text-white" : ""
                }`}
              >
                {format(day.date, "d")}
              </span>

              {/* Móvil: puntos */}
              <div className="flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                {dayTasks.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className={`size-1.5 rounded-full ${TYPE_DOT[t.type]} ${t.status === "hecha" ? "opacity-30" : ""}`}
                  />
                ))}
              </div>

              {/* Escritorio: títulos */}
              <ul className="hidden space-y-0.5 sm:block">
                {dayTasks.slice(0, MAX_CHIPS).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(t);
                      }}
                      title={t.title}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium hover:brightness-95 ${
                        TYPE_STYLES[t.type]
                      } ${t.status === "hecha" ? "line-through opacity-50" : ""}`}
                    >
                      {!t.allDay && t.dueDate && (
                        <span className="mr-1 tabular-nums opacity-70">{format(t.dueDate, "HH:mm")}</span>
                      )}
                      {t.title}
                    </button>
                  </li>
                ))}
                {extra > 0 && <li className="px-1.5 text-xs text-zinc-500">+{extra} más</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
