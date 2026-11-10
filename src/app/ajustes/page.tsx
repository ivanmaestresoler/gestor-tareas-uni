import { Suspense } from "react";
import { connection } from "next/server";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { isGoogleConfigured } from "@/lib/google/auth";
import { disconnectGoogle, saveSyncOptions } from "@/lib/google/actions";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { SyncButton } from "@/components/settings/SyncButton";

export const metadata = { title: "Ajustes · Tareas Uni" };

const GUIDE_URL =
  "https://github.com/ivanmaestresoler/gestor-tareas-uni/blob/main/docs/google-setup.md";

const STATUS_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  conectado: { text: "Cuenta de Google conectada. Pulsa «Sincronizar ahora».", ok: true },
  cancelado: { text: "Has cancelado la conexión con Google.", ok: false },
  error: { text: "No se pudo conectar con Google. Inténtalo de nuevo.", ok: false },
  "sin-refresh-token": {
    text: "Google no devolvió un permiso permanente. Quita el acceso de la app en tu cuenta de Google y vuelve a conectar.",
    ok: false,
  },
  "sin-configurar": { text: "Primero configura las claves de Google en el archivo .env.", ok: false },
};

export default function SettingsPage({ searchParams }: PageProps<"/ajustes">) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Ajustes</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />}>
        <GoogleSection searchParams={searchParams} />
      </Suspense>
      <Card title="Moodle" badge="Próximamente">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          La importación automática de tareas desde Moodle (incluidas las que no tienen fecha) está
          planificada para más adelante.
        </p>
      </Card>
    </div>
  );
}

async function GoogleSection({ searchParams }: { searchParams: PageProps<"/ajustes">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const status = typeof params.google === "string" ? STATUS_MESSAGES[params.google] : undefined;
  const configured = isGoogleConfigured();
  const s = await getSettings();
  const connected = Boolean(s[SETTING_KEYS.googleRefreshToken]);
  const syncTasks = s[SETTING_KEYS.googleSyncTasks] !== "0";
  const syncCalendar = s[SETTING_KEYS.googleSyncCalendar] !== "0";
  const lastSync = s[SETTING_KEYS.googleLastSync];

  return (
    <>
      {status && (
        <p
          role="status"
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            status.ok
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {status.text}
        </p>
      )}

      <Card
        title="Google Tasks y Calendar"
        badge={connected ? "Conectado" : undefined}
        badgeTone="green"
      >
        {!configured ? (
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Para conectar con Google necesitas crear unas claves gratuitas en Google Cloud y ponerlas
              en tu archivo <code className="font-mono">.env</code>:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
              GOOGLE_CLIENT_ID=...{"\n"}GOOGLE_CLIENT_SECRET=...
            </pre>
            <p>
              Sigue la{" "}
              <a href={GUIDE_URL} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                guía paso a paso
              </a>{" "}
              y reinicia la app (<code className="font-mono">npm run dev</code>).
            </p>
          </div>
        ) : !connected ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Conecta tu cuenta para tener tus entregas en el widget de Google Tasks del móvil y tus
              entregas y exámenes en un calendario «Universidad». La app solo podrá ver lo que ella
              misma crea: no tiene acceso a tus otros calendarios.
            </p>
            {/* Es un enlace normal (no un botón de JS) porque nos lleva a la web de Google. */}
            <a
              href="/api/google/connect"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <GoogleLogo /> Conectar con Google
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Conectado como{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {s[SETTING_KEYS.googleEmail] || "tu cuenta de Google"}
              </strong>
              .{" "}
              {lastSync
                ? `Última sincronización ${formatDistanceToNow(new Date(lastSync), { locale: es, addSuffix: true })}.`
                : "Aún no has sincronizado."}
            </p>

            <form action={saveSyncOptions} className="space-y-3">
              <Toggle
                name="syncTasks"
                defaultChecked={syncTasks}
                title="Google Tasks (widget del móvil)"
                text="Todas tus tareas, también las que no tienen fecha, en la lista «Universidad». Si las marcas como hechas en el móvil, la app lo sabrá al sincronizar."
              />
              <Toggle
                name="syncCalendar"
                defaultChecked={syncCalendar}
                title="Google Calendar"
                text="Entregas y exámenes con fecha, como eventos en el calendario «Universidad»."
              />
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                Guardar opciones
              </button>
            </form>

            <SyncButton />

            <p className="text-xs text-zinc-500">
              Las tareas que creas o editas en la app se envían a Google automáticamente. Usa
              «Sincronizar ahora» para traer lo que hayas hecho desde el móvil.
            </p>

            <form action={disconnectGoogle} className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
                Desconectar cuenta de Google
              </button>
            </form>
          </div>
        )}
      </Card>

      <Card title="Widget en tu Android">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            Instala <strong>Google Tasks</strong> desde Play Store e inicia sesión con la misma cuenta.
          </li>
          <li>Mantén pulsado un hueco de la pantalla de inicio → <strong>Widgets</strong>.</li>
          <li>
            Busca <strong>Tasks</strong>, arrastra el widget junto al de Calendar y elige la lista{" "}
            <strong>Universidad</strong>.
          </li>
        </ol>
      </Card>
    </>
  );
}

function Card({
  title,
  badge,
  badgeTone,
  children,
}: {
  title: string;
  badge?: string;
  badgeTone?: "green";
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        {title}
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              badgeTone === "green"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {badge}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Toggle({
  name,
  defaultChecked,
  title,
  text,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  text: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-indigo-600"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{text}</span>
      </span>
    </label>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}
