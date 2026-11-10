import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createOAuthClient, emailFromIdToken } from "@/lib/google/auth";
import { SETTING_KEYS, setSettings } from "@/lib/settings";

/** Paso 2 de OAuth: Google vuelve aquí con un `code` que cambiamos por los tokens. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (status: string) => NextResponse.redirect(new URL(`/ajustes?google=${status}`, url));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (url.searchParams.get("error")) return back("cancelado");
  const code = url.searchParams.get("code");
  if (!code || !expectedState || url.searchParams.get("state") !== expectedState) {
    return back("error");
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) return back("sin-refresh-token");

    await setSettings({
      [SETTING_KEYS.googleRefreshToken]: tokens.refresh_token,
      [SETTING_KEYS.googleEmail]: tokens.id_token ? emailFromIdToken(tokens.id_token) : "",
    });
    return back("conectado");
  } catch (error) {
    console.error("Error en el callback de Google", error);
    return back("error");
  }
}
