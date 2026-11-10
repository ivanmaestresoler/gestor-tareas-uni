"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { deleteSettings, getSetting, SETTING_KEYS, setSettings } from "@/lib/settings";
import { createOAuthClient, isInvalidGrant } from "./auth";
import { syncAll, type SyncSummary } from "./sync";

export type SyncState = {
  ok: boolean;
  message?: string;
  summary?: SyncSummary;
  at?: string;
};

export async function syncNow(): Promise<SyncState> {
  try {
    const summary = await syncAll();
    refresh();
    return { ok: true, summary, at: new Date().toISOString() };
  } catch (error) {
    console.error("Error sincronizando con Google", error);
    if (isInvalidGrant(error)) {
      await disconnectLocally();
      refresh();
      return {
        ok: false,
        message: "Google ha caducado o revocado el permiso. Vuelve a conectar tu cuenta.",
      };
    }
    const raw = (error as Error).message ?? "";
    if (raw.includes("invalid_client")) {
      return {
        ok: false,
        message: "Google no reconoce tus claves. Revisa GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el .env.",
      };
    }
    if (raw.includes("has not been used") || raw.includes("is disabled")) {
      return {
        ok: false,
        message: "Falta activar la API de Google Tasks o de Calendar en tu proyecto de Google Cloud.",
      };
    }
    return { ok: false, message: raw || "Error al sincronizar" };
  }
}

export async function saveSyncOptions(formData: FormData) {
  await setSettings({
    [SETTING_KEYS.googleSyncTasks]: formData.get("syncTasks") === "on" ? "1" : "0",
    [SETTING_KEYS.googleSyncCalendar]: formData.get("syncCalendar") === "on" ? "1" : "0",
  });
  refresh();
}

export async function disconnectGoogle() {
  const token = await getSetting(SETTING_KEYS.googleRefreshToken);
  if (token) {
    // Revocamos el permiso en Google (si falla, da igual: lo borramos igualmente).
    await createOAuthClient()
      .revokeToken(token)
      .catch(() => undefined);
  }
  await disconnectLocally();
  refresh();
}

/**
 * Olvida la conexión: tokens, ids de lista/calendario y los enlaces de cada tarea
 * (por si la próxima vez conectas otra cuenta). No borra nada en Google.
 */
async function disconnectLocally() {
  await deleteSettings([
    SETTING_KEYS.googleRefreshToken,
    SETTING_KEYS.googleEmail,
    SETTING_KEYS.googleTaskListId,
    SETTING_KEYS.googleCalendarId,
    SETTING_KEYS.googleLastSync,
  ]);
  await db.update(tasks).set({ googleTaskId: null, googleEventId: null });
}
