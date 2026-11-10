"use client";

import { PlusIcon } from "@/components/icons";
import { useTaskDialog } from "./TaskDialogProvider";

/** Botón "Nueva tarea": en escritorio va en la cabecera y en móvil flota abajo a la derecha. */
export function NewTaskButton() {
  const { openNew } = useTaskDialog();
  return (
    <>
      <button
        type="button"
        onClick={() => openNew()}
        className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:inline-flex"
      >
        <PlusIcon className="size-4" /> Nueva tarea
      </button>
      <button
        type="button"
        onClick={() => openNew()}
        aria-label="Nueva tarea"
        className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 active:scale-95 sm:hidden"
      >
        <PlusIcon className="size-6" />
      </button>
    </>
  );
}
