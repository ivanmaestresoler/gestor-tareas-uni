import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createOAuthClient, GOOGLE_SCOPES, isGoogleConfigured } from "@/lib/google/auth";

/**
 * Paso 1 de OAuth: redirige a la pantalla de Google para que des permiso.
 *
 * `state` es un valor aleatorio que guardamos en una cookie y que Google nos
 * devuelve en el callback. Así comprobamos que la respuesta viene de una
 * conexión que iniciaste tú (protección contra ataques CSRF).
 */
export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/ajustes?google=sin-configurar", request.url));
  }
  const state = randomBytes(24).toString("hex");
  (await cookies()).set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = createOAuthClient().generateAuthUrl({
    access_type: "offline", // para recibir un refresh token y no tener que reconectar cada hora
    prompt: "consent", // fuerza a Google a darnos el refresh token también al reconectar
    scope: GOOGLE_SCOPES,
    state,
  });
  return NextResponse.redirect(url);
}
