import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/db/schema";
import {
  fromGoogleTask,
  googleTaskDiffers,
  resolveStatus,
  toCalendarEvent,
  toGoogleTask,
} from "./mapping";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 7,
    title: "Práctica 3",
    subject: "EDA",
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
    googleTaskId: null,
    createdAt: new Date("2026-11-01T10:00:00"),
    updatedAt: new Date("2026-11-01T10:00:00"),
    ...overrides,
  };
}

describe("toGoogleTask", () => {
  it("una tarea sin fecha va sin 'due' (y aparece igualmente en el widget)", () => {
    const g = toGoogleTask(task());
    expect(g.due).toBeNull();
    expect(g.title).toBe("Práctica 3 · EDA");
    expect(g.status).toBe("needsAction");
  });

  it("guarda el día a medianoche UTC y la hora en las notas", () => {
    const g = toGoogleTask(task({ dueDate: new Date("2026-11-20T23:59:00"), notes: "En PDF" }));
    expect(g.due).toBe("2026-11-20T00:00:00.000Z");
    expect(g.notes).toBe("Entrega · Hora límite: 23:59\n\nEn PDF");
  });

  it("la asignatura sale en el título pero no se repite en las notas", () => {
    const g = toGoogleTask(task({ subject: "Física" }));
    expect(g.title).toBe("Práctica 3 · Física");
    expect(g.notes).not.toContain("Física");
  });

  it("una tarea hecha se marca como completada", () => {
    expect(toGoogleTask(task({ status: "hecha" })).status).toBe("completed");
  });
});

describe("googleTaskDiffers", () => {
  it("no actualiza si todo coincide", () => {
    const body = toGoogleTask(task());
    expect(googleTaskDiffers(body, { ...body })).toBe(false);
  });

  it("detecta cambios de título o fecha", () => {
    const body = toGoogleTask(task());
    expect(googleTaskDiffers(body, { ...body, title: "Otro" })).toBe(true);
    expect(googleTaskDiffers(body, { ...body, due: "2026-11-21T00:00:00.000Z" })).toBe(true);
  });
});

describe("resolveStatus", () => {
  const local = task({ updatedAt: new Date("2026-11-10T10:00:00Z") });

  it("si coinciden no hay nada que hacer", () => {
    expect(resolveStatus(local, { status: "needsAction", updated: "2026-11-11T00:00:00Z" })).toBe("same");
  });

  it("si la marcaste como hecha en el móvil después, gana Google", () => {
    expect(resolveStatus(local, { status: "completed", updated: "2026-11-10T12:00:00Z" })).toBe("remote");
  });

  it("si el cambio en la app es más reciente, gana la app", () => {
    expect(resolveStatus(local, { status: "completed", updated: "2026-11-09T12:00:00Z" })).toBe("local");
  });
});

describe("fromGoogleTask", () => {
  it("convierte una tarea creada desde el widget", () => {
    const t = fromGoogleTask({ id: "abc", title: " Comprar bata ", due: "2026-11-20T00:00:00.000Z", status: "needsAction" });
    expect(t.title).toBe("Comprar bata");
    expect(t.googleTaskId).toBe("abc");
    expect(t.allDay).toBe(true);
    expect([t.dueDate?.getFullYear(), t.dueDate?.getMonth(), t.dueDate?.getDate()]).toEqual([2026, 10, 20]);
  });
});

describe("toCalendarEvent", () => {
  const tz = "Europe/Madrid";

  it("las tareas sin fecha o de tipo 'otro' no van al calendario", () => {
    expect(toCalendarEvent(task(), tz)).toBeNull();
    expect(toCalendarEvent(task({ type: "otro", dueDate: new Date("2026-11-20T10:00:00") }), tz)).toBeNull();
  });

  it("sin hora → evento de día completo", () => {
    const e = toCalendarEvent(task({ dueDate: new Date("2026-11-20T00:00:00"), allDay: true }), tz)!;
    expect(e.start).toEqual({ date: "2026-11-20" });
    expect(e.end).toEqual({ date: "2026-11-21" });
  });

  it("entrega con hora → bloque de 30 min que termina a la hora límite", () => {
    const e = toCalendarEvent(task({ dueDate: new Date("2026-11-20T23:59:00") }), tz)!;
    expect(e.start.dateTime).toBe("2026-11-20T23:29:00");
    expect(e.end.dateTime).toBe("2026-11-20T23:59:00");
    expect(e.summary).toBe("Entrega: Práctica 3 (EDA)");
  });

  it("examen con hora → bloque de 2 h y color rojo", () => {
    const e = toCalendarEvent(task({ type: "examen", dueDate: new Date("2026-11-20T09:00:00") }), tz)!;
    expect(e.end.dateTime).toBe("2026-11-20T11:00:00");
    expect(e.colorId).toBe("11");
  });

  it("marca con ✓ las tareas hechas", () => {
    const e = toCalendarEvent(task({ status: "hecha", dueDate: new Date("2026-11-20T09:00:00") }), tz)!;
    expect(e.summary.startsWith("✓ ")).toBe(true);
  });
});
