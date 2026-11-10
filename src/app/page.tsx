import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Task } from "@/lib/db/schema";
import { getAllTasks, getSubjects } from "@/lib/tasks/queries";
import { applyFilters, computeStats, groupTasks, parseFilters } from "@/lib/tasks/filters";
import { TaskDialogProvider } from "@/components/tasks/TaskDialogProvider";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { FiltersBar } from "@/components/tasks/FiltersBar";
import { TaskCard } from "@/components/tasks/TaskCard";

export default function HomePage({ searchParams }: PageProps<"/">) {
  // Suspense muestra el "esqueleto" mientras se leen las tareas de la base de datos.
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TaskList searchParams={searchParams} />
    </Suspense>
  );
}

async function TaskList({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [params, all] = await Promise.all([searchParams, getAllTasks()]);
  const now = new Date();
  const filters = parseFilters(params);
  const subjects = getSubjects(all);
  const stats = computeStats(all, now);
  const groups = groupTasks(applyFilters(all, filters), now);
  const showPending = filters.status !== "hechas";
  const showDone = filters.status !== "pendientes";
  const nothing =
    groups.overdue.length + groups.upcoming.length + groups.noDate.length + groups.done.length === 0;

  return (
    <TaskDialogProvider subjects={subjects}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 first-letter:uppercase dark:text-zinc-400">
            {format(now, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mis tareas</h1>
        </div>
        <NewTaskButton />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pendientes" value={stats.pending} />
        <Stat label="Próximos 7 días" value={stats.thisWeek} />
        <Stat label="Sin fecha" value={stats.noDate} tone="amber" />
        <Stat label="Atrasadas" value={stats.overdue} tone={stats.overdue ? "red" : undefined} />
      </dl>

      <div className="mb-6">
        <FiltersBar />
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="Aún no tienes tareas"
          text="Crea tu primera tarea con el botón «Nueva tarea». En la fase 2 podrás importarlas de Moodle."
        />
      ) : nothing ? (
        <EmptyState title="Nada por aquí" text="Ninguna tarea coincide con los filtros." />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* "Sin fecha" va en una columna destacada a la derecha (arriba en móvil). */}
          {showPending && groups.noDate.length > 0 && (
            <aside className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4 lg:sticky lg:top-20 lg:order-2 dark:border-amber-500/30 dark:bg-amber-500/5">
              <div className="mb-3">
                <h2 className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                  Sin fecha
                  <span className="rounded-full bg-amber-200/80 px-2 text-xs dark:bg-amber-500/20">
                    {groups.noDate.length}
                  </span>
                </h2>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  No salen en ningún calendario: que no se te pasen.
                </p>
              </div>
              <TaskStack tasks={groups.noDate} now={now} />
            </aside>
          )}

          <div className="space-y-8 lg:order-1">
            {showPending && groups.overdue.length > 0 && (
              <Section title="Atrasadas" count={groups.overdue.length} tone="red">
                <TaskStack tasks={groups.overdue} now={now} />
              </Section>
            )}
            {showPending && groups.upcoming.length > 0 && (
              <Section title="Próximas" count={groups.upcoming.length}>
                <TaskStack tasks={groups.upcoming} now={now} />
              </Section>
            )}
            {showDone && groups.done.length > 0 && (
              <Section title="Hechas" count={groups.done.length}>
                <TaskStack tasks={groups.done} now={now} />
              </Section>
            )}
          </div>
        </div>
      )}
    </TaskDialogProvider>
  );
}

function TaskStack({ tasks, now }: { tasks: Task[]; now: Date }) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} now={now} />
      ))}
    </div>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: "red";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase ${
          tone === "red" ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {title} <span className="font-normal">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "amber" | "red" }) {
  const color =
    tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "red"
        ? "text-red-600 dark:text-red-400"
        : "";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando tareas">
      <div className="h-10 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[74px] rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
