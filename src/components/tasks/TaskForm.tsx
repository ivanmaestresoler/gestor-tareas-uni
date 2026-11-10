"use client";

import { useActionState, useEffect } from "react";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES, type Task } from "@/lib/db/schema";
import { saveTask, type ActionState } from "@/lib/tasks/actions";
import { PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/tasks/labels";
import { toDateInput, toTimeInput } from "@/lib/format";

interface Props {
  task?: Task;
  defaultDate?: string;
  subjects: string[];
  onDone: () => void;
  onCancel: () => void;
}

const initialState: ActionState = { ok: false };

export function TaskForm({ task, defaultDate, subjects, onDone, onCancel }: Props) {
  // useActionState conecta el formulario con la Server Action y nos da su resultado
  // (errores de validación) y si está enviándose (`pending`).
  const [state, formAction, pending] = useActionState(saveTask, initialState);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const err = (field: string) => state.errors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}

      <Field label="Título" error={err("title")}>
        <input
          name="title"
          defaultValue={task?.title}
          required
          autoFocus
          placeholder="Práctica 3: árboles binarios"
          className="field"
          aria-invalid={Boolean(err("title"))}
        />
      </Field>

      <Field label="Asignatura" error={err("subject")}>
        <input
          name="subject"
          defaultValue={task?.subject ?? ""}
          list="subjects-list"
          placeholder="Estructuras de Datos"
          className="field"
        />
        <datalist id="subjects-list">
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo" error={err("type")}>
          <select name="type" defaultValue={task?.type ?? "entrega"} className="field">
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioridad" error={err("priority")}>
          <select name="priority" defaultValue={task?.priority ?? "media"} className="field">
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" hint="Opcional" error={err("date")}>
          <input
            type="date"
            name="date"
            defaultValue={task ? toDateInput(task.dueDate) : (defaultDate ?? "")}
            className="field"
          />
        </Field>
        <Field label="Hora" hint="Opcional" error={err("time")}>
          <input
            type="time"
            name="time"
            defaultValue={task ? toTimeInput(task.dueDate, task.allDay) : ""}
            className="field"
          />
        </Field>
      </div>

      <Field label="Estado" error={err("status")}>
        <select name="status" defaultValue={task?.status ?? "pendiente"} className="field">
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notas" error={err("notes")}>
        <textarea
          name="notes"
          defaultValue={task?.notes ?? ""}
          rows={3}
          placeholder="Enunciado en el aula virtual, entregar en PDF…"
          className="field resize-y"
        />
      </Field>

      {state.message && !state.ok && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Guardando…" : task ? "Guardar cambios" : "Crear tarea"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {hint && <span className="text-xs font-normal text-zinc-400">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}
