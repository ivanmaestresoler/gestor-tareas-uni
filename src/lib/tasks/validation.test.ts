import { describe, expect, it } from "vitest";
import { parseTaskForm } from "./validation";

const base = { title: "Práctica 1", type: "entrega", priority: "media", status: "pendiente" };

describe("parseTaskForm", () => {
  it("acepta una tarea sin fecha", () => {
    const r = parseTaskForm({ ...base, date: "", time: "", subject: "", notes: "" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.dueDate).toBeNull();
    expect(r.data.allDay).toBe(false);
    expect(r.data.subject).toBeNull();
    expect(r.data.notes).toBeNull();
  });

  it("con fecha y sin hora la marca como 'todo el día'", () => {
    const r = parseTaskForm({ ...base, date: "2026-12-01", time: "" });
    expect(r.success && r.data.allDay).toBe(true);
    expect(r.success && r.data.dueDate?.getDate()).toBe(1);
  });

  it("con fecha y hora guarda la hora exacta", () => {
    const r = parseTaskForm({ ...base, date: "2026-12-01", time: "23:59" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.allDay).toBe(false);
    expect(r.data.dueDate?.getHours()).toBe(23);
    expect(r.data.dueDate?.getMinutes()).toBe(59);
  });

  it("recorta espacios y exige título", () => {
    const r = parseTaskForm({ ...base, title: "   " });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.errors.title?.[0]).toMatch(/obligatorio/);
  });

  it("rechaza tipos no válidos", () => {
    const r = parseTaskForm({ ...base, type: "fiesta" });
    expect(r.success).toBe(false);
  });

  it("no permite hora sin fecha", () => {
    const r = parseTaskForm({ ...base, date: "", time: "10:00" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.errors.date).toBeDefined();
  });
});
