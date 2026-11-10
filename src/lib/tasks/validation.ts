import { z } from "zod";
import { TASK_TYPES } from "@/lib/db/schema";

/** Convierte "" en undefined para que los campos vacíos cuenten como "no rellenado". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/**
 * Esquema del formulario de tarea. La fecha y la hora llegan como texto desde
 * los <input type="date"> y <input type="time"> (ambos opcionales).
 *
 * El estado (hecha/pendiente) no está en el formulario: una tarea nueva empieza
 * pendiente y se marca como hecha con la casilla de la tarjeta.
 */
export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(200, "Máximo 200 caracteres"),
    subject: optionalText(100),
    type: z.enum(TASK_TYPES, { error: "Tipo no válido" }),
    date: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha no válida")
      .optional(),
    time: z
      .string()
      .regex(/^(\d{2}:\d{2})?$/, "Hora no válida")
      .optional(),
    notes: optionalText(5000),
  })
  .refine((v) => !(v.time && !v.date), {
    message: "Si pones hora, indica también la fecha",
    path: ["date"],
  });

export type TaskFormValues = z.input<typeof taskFormSchema>;

export interface TaskInput {
  title: string;
  subject: string | null;
  type: (typeof TASK_TYPES)[number];
  dueDate: Date | null;
  allDay: boolean;
  notes: string | null;
}

export type ParseResult =
  | { success: true; data: TaskInput }
  | { success: false; errors: Record<string, string[]> };

/**
 * Valida los datos del formulario y los transforma al formato de la base de datos.
 * Las fechas se interpretan en la zona horaria local (la app se usa en local).
 */
export function parseTaskForm(raw: Record<string, unknown>): ParseResult {
  const result = taskFormSchema.safeParse(raw);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return { success: false, errors: fieldErrors as Record<string, string[]> };
  }
  const { date, time, subject, notes, ...rest } = result.data;
  const hasDate = Boolean(date);
  const hasTime = Boolean(time);
  const dueDate = hasDate ? new Date(`${date}T${hasTime ? time : "00:00"}:00`) : null;

  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return { success: false, errors: { date: ["Fecha no válida"] } };
  }

  return {
    success: true,
    data: {
      ...rest,
      subject: subject ?? null,
      notes: notes ?? null,
      dueDate,
      allDay: hasDate && !hasTime,
    },
  };
}

/** Pasa un FormData a objeto plano (solo valores de texto). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}
