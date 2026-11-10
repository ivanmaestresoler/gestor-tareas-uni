import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/db/schema";
import { applyFilters, computeStats, groupTasks, isOverdue, parseFilters, sortTasks } from "./filters";

let nextId = 1;
function task(overrides: Partial<Task> = {}): Task {
  return {
    id: nextId++,
    title: "Tarea",
    subject: null,
    type: "entrega",
    dueDate: null,
    allDay: false,
    priority: "media",
    status: "pendiente",
    notes: null,
    source: "manual",
    externalId: null,
    externalUrl: null,
    googleEventId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const NOW = new Date("2026-11-10T12:00:00");

describe("parseFilters", () => {
  it("por defecto muestra solo pendientes", () => {
    expect(parseFilters({})).toEqual({ status: "pendientes" });
  });

  it("ignora valores no válidos", () => {
    const f = parseFilters({ tipo: "fiesta", prioridad: "urgente", estado: "x" });
    expect(f.type).toBeUndefined();
    expect(f.priority).toBeUndefined();
    expect(f.status).toBe("pendientes");
  });

  it("lee los filtros válidos", () => {
    const f = parseFilters({ q: " árbol ", asignatura: "Física", tipo: "examen", estado: "todas" });
    expect(f).toMatchObject({ q: "árbol", subject: "Física", type: "examen", status: "todas" });
  });
});

describe("applyFilters", () => {
  const tasks = [
    task({ title: "Práctica de árboles", subject: "EDA" }),
    task({ title: "Parcial", subject: "Cálculo", type: "examen" }),
    task({ title: "Hecha", status: "hecha" }),
  ];

  it("busca sin distinguir tildes ni mayúsculas", () => {
    const r = applyFilters(tasks, { status: "todas", q: "ARBOLES" });
    expect(r.map((t) => t.title)).toEqual(["Práctica de árboles"]);
  });

  it("filtra por tipo y estado", () => {
    expect(applyFilters(tasks, { status: "pendientes", type: "examen" })).toHaveLength(1);
    expect(applyFilters(tasks, { status: "hechas" })).toHaveLength(1);
    expect(applyFilters(tasks, { status: "todas" })).toHaveLength(3);
  });
});

describe("isOverdue", () => {
  it("una tarea de todo el día de hoy NO está atrasada", () => {
    expect(isOverdue({ dueDate: new Date("2026-11-10T00:00:00"), allDay: true, status: "pendiente" }, NOW)).toBe(false);
  });

  it("una tarea con hora ya pasada SÍ está atrasada", () => {
    expect(isOverdue({ dueDate: new Date("2026-11-10T09:00:00"), allDay: false, status: "pendiente" }, NOW)).toBe(true);
  });

  it("una tarea hecha nunca está atrasada", () => {
    expect(isOverdue({ dueDate: new Date("2026-01-01"), allDay: false, status: "hecha" }, NOW)).toBe(false);
  });
});

describe("groupTasks y sortTasks", () => {
  it("reparte en atrasadas, próximas, sin fecha y hechas", () => {
    const g = groupTasks(
      [
        task({ title: "sin fecha" }),
        task({ title: "atrasada", dueDate: new Date("2026-11-01T10:00:00") }),
        task({ title: "próxima", dueDate: new Date("2026-11-20T10:00:00") }),
        task({ title: "hecha", status: "hecha", dueDate: new Date("2026-11-20T10:00:00") }),
      ],
      NOW,
    );
    expect(g.noDate.map((t) => t.title)).toEqual(["sin fecha"]);
    expect(g.overdue.map((t) => t.title)).toEqual(["atrasada"]);
    expect(g.upcoming.map((t) => t.title)).toEqual(["próxima"]);
    expect(g.done.map((t) => t.title)).toEqual(["hecha"]);
  });

  it("ordena por fecha y, sin fecha, por prioridad", () => {
    const sorted = sortTasks([
      task({ title: "baja", priority: "baja" }),
      task({ title: "tarde", dueDate: new Date("2026-11-30") }),
      task({ title: "alta", priority: "alta" }),
      task({ title: "pronto", dueDate: new Date("2026-11-11") }),
    ]);
    expect(sorted.map((t) => t.title)).toEqual(["pronto", "tarde", "alta", "baja"]);
  });
});

describe("computeStats", () => {
  it("cuenta pendientes, próximos 7 días, sin fecha y atrasadas", () => {
    const stats = computeStats(
      [
        task(),
        task({ dueDate: new Date("2026-11-12T10:00:00") }),
        task({ dueDate: new Date("2026-11-30T10:00:00") }),
        task({ dueDate: new Date("2026-11-09T10:00:00") }),
        task({ status: "hecha" }),
      ],
      NOW,
    );
    expect(stats).toEqual({ pending: 4, thisWeek: 1, noDate: 1, overdue: 1 });
  });
});
