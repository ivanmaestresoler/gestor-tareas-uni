import { Suspense } from "react";
import Link from "next/link";
import { addMonths, format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type { Task } from "@/lib/db/schema";
import { buildMonthGrid, dayKey, gridRange, monthKey, parseMonthParam } from "@/lib/calendar";
import { getAllTasks, getSubjects, getTasksBetween } from "@/lib/tasks/queries";
import { TaskDialogProvider } from "@/components/tasks/TaskDialogProvider";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Calendario · Tareas Uni" };

export default function CalendarPage({ searchParams }: PageProps<"/calendario">) {
  return (
    <Suspense
      fallback={<div className="h-[600px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />}
    >
      <Calendar searchParams={searchParams} />
    </Suspense>
  );
}

async function Calendar({
  searchParams,
}: {
  searchParams: PageProps<"/calendario">["searchParams"];
}) {
  const params = await searchParams;
  const all = await getAllTasks();
  const now = new Date();
  const month = parseMonthParam(typeof params.mes === "string" ? params.mes : undefined, now);
  const weeks = buildMonthGrid(month, now);
  const { from, to } = gridRange(weeks);
  const visible = await getTasksBetween(from, to);

  const tasksByDay: Record<string, Task[]> = {};
  for (const t of visible) {
    if (!t.dueDate) continue;
    (tasksByDay[dayKey(t.dueDate)] ??= []).push(t);
  }
  const monthTasks = visible.filter((t) => t.dueDate && monthKey(t.dueDate) === monthKey(month));
  const noDateCount = all.filter((t) => !t.dueDate && t.status === "pendiente").length;

  return (
    <TaskDialogProvider subjects={getSubjects(all)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight capitalize sm:text-3xl">
            {format(month, "MMMM yyyy", { locale: es })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Link
              href={`/calendario?mes=${monthKey(subMonths(month, 1))}`}
              className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Mes anterior"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
            <Link
              href="/calendario"
              className="border-x border-zinc-200 px-3 py-1.5 text-sm font-medium dark:border-zinc-800"
            >
              Hoy
            </Link>
            <Link
              href={`/calendario?mes=${monthKey(addMonths(month, 1))}`}
              className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Mes siguiente"
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </div>
          <NewTaskButton />
        </div>
      </div>

      {noDateCount > 0 && (
        <Link
          href="/"
          className="mb-4 flex items-center justify-between rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-200"
        >
          <span>
            Tienes <strong>{noDateCount}</strong> {noDateCount === 1 ? "tarea" : "tareas"} sin fecha
            que no aparecen en el calendario
          </span>
          <ChevronRightIcon className="size-4" />
        </Link>
      )}

      <MonthGrid weeks={weeks} tasksByDay={tasksByDay} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Este mes <span className="font-normal">{monthTasks.length}</span>
        </h2>
        {monthTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay tareas con fecha este mes.</p>
        ) : (
          <div className="space-y-2">
            {monthTasks.map((t) => (
              <TaskCard key={t.id} task={t} now={now} />
            ))}
          </div>
        )}
      </section>
    </TaskDialogProvider>
  );
}
