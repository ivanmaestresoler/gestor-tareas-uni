"use client";

import { useOptimistic, useTransition } from "react";
import type { Task } from "@/lib/db/schema";
import { deleteTask, toggleTaskStatus } from "@/lib/tasks/actions";
import { isOverdue } from "@/lib/tasks/filters";
import { PRIORITY_LABELS, PRIORITY_STYLES, TYPE_LABELS, TYPE_STYLES } from "@/lib/tasks/labels";
import { formatDue, relativeDay } from "@/lib/format";
import { CheckIcon, ClockIcon, LinkIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { useTaskDialog } from "./TaskDialogProvider";

export function TaskCard({ task, now }: { task: Task; now: Date }) {
  const { openEdit } = useTaskDialog();
  const [, startTransition] = useTransition();
  // useOptimistic: marcamos la tarea como hecha al instante, sin esperar al servidor.
  const [done, setOptimisticDone] = useOptimistic(task.status === "hecha");
  const overdue = !done && isOverdue(task, now);

  function toggle() {
    startTransition(async () => {
      setOptimisticDone(!done);
      await toggleTaskStatus(task.id);
    });
  }

  function remove() {
    if (!confirm(`¿Borrar "${task.title}"? Esta acción no se puede deshacer.`)) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <article
      className={`group flex gap-3 rounded-xl border bg-white p-3.5 shadow-xs transition hover:shadow-sm dark:bg-zinc-900 ${
        overdue
          ? "border-red-200 dark:border-red-500/30"
          : "border-zinc-200 dark:border-zinc-800"
      } ${done ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? "Marcar como pendiente" : "Marcar como hecha"}
        aria-pressed={done}
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition ${
          done
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-zinc-300 hover:border-indigo-500 dark:border-zinc-600"
        }`}
      >
        {done && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-medium leading-snug break-words ${done ? "text-zinc-500 line-through" : ""}`}
          >
            {task.title}
          </h3>
          <div className="-mt-1 -mr-1 flex shrink-0 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => openEdit(task)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Editar"
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              aria-label="Borrar"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span className={`rounded-md px-1.5 py-0.5 font-medium ${TYPE_STYLES[task.type]}`}>
            {TYPE_LABELS[task.type]}
          </span>
          {task.subject && (
            <span className="truncate text-zinc-600 dark:text-zinc-400">{task.subject}</span>
          )}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 ${
                overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <ClockIcon className="size-3.5" />
              {formatDue(task.dueDate, task.allDay)}
              <span className="text-zinc-400">· {relativeDay(task.dueDate, now)}</span>
            </span>
          )}
          <span className={`font-medium ${PRIORITY_STYLES[task.priority]}`}>
            {"●"} {PRIORITY_LABELS[task.priority]}
          </span>
          {task.externalUrl && (
            <a
              href={task.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <LinkIcon className="size-3.5" /> Moodle
            </a>
          )}
        </div>

        {task.notes && (
          <p className="mt-2 line-clamp-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
            {task.notes}
          </p>
        )}
      </div>
    </article>
  );
}
