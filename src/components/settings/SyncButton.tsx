"use client";

import { useActionState } from "react";
import { syncNow, type SyncState } from "@/lib/google/actions";

export function SyncButton() {
  const [state, action, pending] = useActionState<SyncState>(syncNow, { ok: false });
  const s = state.summary;

  return (
    <div className="space-y-3">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          <span className={pending ? "animate-spin" : ""} aria-hidden>
            ↻
          </span>
          {pending ? "Sincronizando…" : "Sincronizar ahora"}
        </button>
      </form>

      {state.message && !state.ok && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state.ok && s && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          ✓ Sincronizado.{" "}
          {[
            s.tasksCreated && `${s.tasksCreated} tareas subidas`,
            s.tasksUpdated && `${s.tasksUpdated} actualizadas`,
            s.completedFromGoogle && `${s.completedFromGoogle} completadas desde el móvil`,
            s.importedFromGoogle && `${s.importedFromGoogle} nuevas desde Google Tasks`,
            s.eventsUpserted && `${s.eventsUpserted} eventos en el calendario`,
            s.eventsDeleted && `${s.eventsDeleted} eventos borrados`,
          ]
            .filter(Boolean)
            .join(" · ") || "No había cambios."}
        </p>
      )}
    </div>
  );
}
