"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/db/schema";
import { XIcon } from "@/components/icons";
import { TaskForm } from "./TaskForm";

/**
 * Un único diálogo de "Nueva tarea / Editar tarea" compartido por toda la página.
 * Cualquier componente puede abrirlo con `useTaskDialog()`.
 */
type DialogState =
  | { mode: "new"; defaults?: { date?: string }; key: number }
  | { mode: "edit"; task: Task; key: number };

interface TaskDialogApi {
  openNew: (defaults?: { date?: string }) => void;
  openEdit: (task: Task) => void;
}

const TaskDialogContext = createContext<TaskDialogApi | null>(null);

export function useTaskDialog() {
  const ctx = useContext(TaskDialogContext);
  if (!ctx) throw new Error("useTaskDialog debe usarse dentro de <TaskDialogProvider>");
  return ctx;
}

export function TaskDialogProvider({
  subjects,
  children,
}: {
  subjects: string[];
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<DialogState | null>(null);

  const openNew = useCallback((defaults?: { date?: string }) => {
    setState({ mode: "new", defaults, key: Date.now() });
  }, []);
  const openEdit = useCallback((task: Task) => {
    setState({ mode: "edit", task, key: Date.now() });
  }, []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  // Abre el <dialog> nativo cuando hay algo que mostrar.
  useEffect(() => {
    if (state && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [state]);

  return (
    <TaskDialogContext.Provider value={{ openNew, openEdit }}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={() => setState(null)}
        // Cierra al pulsar fuera del cuadro (sobre el fondo oscuro).
        onClick={(e) => e.target === dialogRef.current && close()}
        aria-labelledby="task-dialog-title"
        className="m-0 mt-auto w-full max-w-none rounded-t-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl sm:m-auto sm:max-w-lg sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {state && (
          <div className="max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="task-dialog-title" className="text-lg font-semibold">
                {state.mode === "edit" ? "Editar tarea" : "Nueva tarea"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Cerrar"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <TaskForm
              key={state.key}
              task={state.mode === "edit" ? state.task : undefined}
              defaultDate={state.mode === "new" ? state.defaults?.date : undefined}
              subjects={subjects}
              onDone={close}
              onCancel={close}
            />
          </div>
        )}
      </dialog>
    </TaskDialogContext.Provider>
  );
}
