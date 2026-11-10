import { describe, expect, it } from "vitest";
import { buildMonthGrid, parseMonthParam } from "./calendar";

const TODAY = new Date("2026-11-10T12:00:00");

describe("buildMonthGrid", () => {
  it("noviembre 2026 empieza en lunes 26 de octubre y tiene semanas completas", () => {
    const weeks = buildMonthGrid(new Date("2026-11-01T00:00:00"), TODAY);
    expect(weeks[0][0].key).toBe("2026-10-26");
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.at(-1)!.at(-1)!.key).toBe("2026-12-06");
  });

  it("marca el día de hoy y los días fuera del mes", () => {
    const days = buildMonthGrid(new Date("2026-11-01T00:00:00"), TODAY).flat();
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual(["2026-11-10"]);
    expect(days.find((d) => d.key === "2026-10-31")?.inMonth).toBe(false);
  });
});

describe("parseMonthParam", () => {
  it("lee ?mes=2027-02", () => {
    const d = parseMonthParam("2027-02", TODAY);
    expect([d.getFullYear(), d.getMonth()]).toEqual([2027, 1]);
  });

  it("vuelve al mes actual si el valor no es válido", () => {
    const d = parseMonthParam("hola", TODAY);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 1]);
  });
});
