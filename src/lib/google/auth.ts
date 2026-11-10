import { OAuth2Client } from "google-auth-library";
import { getSettings, SETTING_KEYS, setSettings } from "@/lib/settings";

/**
 * Permisos (scopes) que pedimos a Google. Pedimos solo lo mínimo:
 * - calendar.app.created: crear NUESTRO calendario "Universidad" y gestionar sus
 *   eventos. No da acceso al resto de tus calendarios (ni a tu horario de clases).
 * - tasks: crear y leer tareas de Google Tasks (para el widget del móvil).
 * - openid + email: solo para mostrar con qué cuenta estás conectado.
 */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.app.created",
  "https://www.googleapis.com/auth/tasks",
];

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function createOAuthClient(): OAuth2Client {
  if (!isGoogleConfigured()) {
    throw new Error("Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el archivo .env");
  }
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback",
  });
}

/**
 * Devuelve un cliente autenticado con el refresh token guardado, o null si no
 * hay cuenta conectada. La librería renueva sola el access token (dura 1 hora).
 */
export async function getAuthorizedClient(): Promise<OAuth2Client | null> {
  if (!isGoogleConfigured()) return null;
  const refreshToken = (await getSettings())[SETTING_KEYS.googleRefreshToken];
  if (!refreshToken) return null;

  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  // Si Google nos da un refresh token nuevo, lo guardamos.
  client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      void setSettings({ [SETTING_KEYS.googleRefreshToken]: tokens.refresh_token });
    }
  });
  return client;
}

/** El refresh token ya no vale (revocado o caducado): hay que volver a conectar. */
export function isInvalidGrant(error: unknown): boolean {
  const message =
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    (error as Error)?.message;
  return typeof message === "string" && message.includes("invalid_grant");
}
