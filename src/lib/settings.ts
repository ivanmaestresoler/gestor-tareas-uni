import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

/** Claves que guardamos en la tabla `settings`. */
export const SETTING_KEYS = {
  googleRefreshToken: "google_refresh_token",
  googleEmail: "google_email",
  googleTaskListId: "google_tasklist_id",
  googleCalendarId: "google_calendar_id",
  googleSyncTasks: "google_sync_tasks",
  googleSyncCalendar: "google_sync_calendar",
  googleLastSync: "google_last_sync",
} as const;

type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSettings(): Promise<Partial<Record<SettingKey, string>>> {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: SettingKey): Promise<string | undefined> {
  return (await getSettings())[key];
}

export async function setSettings(values: Partial<Record<SettingKey, string>>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}

export async function deleteSettings(keys: SettingKey[]) {
  await db.delete(settings).where(inArray(settings.key, keys));
}
