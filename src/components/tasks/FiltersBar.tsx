"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { TASK_TYPES } from "@/lib/db/schema";
import { TYPE_LABELS } from "@/lib/tasks/labels";
import { SearchIcon } from "@/components/icons";

const STATUS_OPTIONS = [
  { value: "pendientes", label: "Pendientes" },
  { value: "hechas", label: "Hechas" },
  { value: "todas", label: "Todas" },
];

/**
 * Los filtros se guardan en la URL (?asignatura=...&tipo=...). Ventajas: el
 * servidor puede filtrar, el botón "atrás" funciona y puedes guardar el enlace.
 */
export function FiltersBar({ subjects }: { subjects: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Búsqueda con "debounce": espera 300 ms tras dejar de escribir.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const id = setTimeout(() => setParam("q", query.trim()), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const status = params.get("estado") ?? "pendientes";
  const hasFilters = ["q", "asignatura", "tipo", "estado"].some((k) => params.has(k));

  return (
    <div
      className={`flex flex-col gap-2 transition-opacity sm:flex-row sm:flex-wrap sm:items-center ${
        isPending ? "opacity-70" : ""
      }`}
    >
      <div className="relative min-w-0 sm:w-56">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar tareas"
          className="field pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <select
          aria-label="Asignatura"
          value={params.get("asignatura") ?? ""}
          onChange={(e) => setParam("asignatura", e.target.value)}
          className="field sm:w-44"
        >
          <option value="">Asignatura</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Tipo"
          value={params.get("tipo") ?? ""}
          onChange={(e) => setParam("tipo", e.target.value)}
          className="field sm:w-32"
        >
          <option value="">Tipo</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <div
          role="radiogroup"
          aria-label="Estado"
          className="flex flex-1 rounded-lg bg-zinc-200/70 p-0.5 text-sm sm:flex-none dark:bg-zinc-800/70"
        >
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={status === o.value}
              onClick={() => setParam("estado", o.value === "pendientes" ? "" : o.value)}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                status === o.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="px-2 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
