# Configurar Google (Tasks + Calendar)

Esta guía explica cómo crear las claves gratuitas que necesita la app para conectarse a tu cuenta
de Google. Solo hay que hacerlo una vez y se tarda unos 10 minutos.

> **¿Qué permisos pide la app?** Solo dos, y los mínimos necesarios:
> - `calendar.app.created`: crear **su propio** calendario «Universidad» y gestionar sus eventos.
>   **No** puede ver ni modificar tus otros calendarios, como el del horario de clases.
> - `tasks`: crear y leer tareas en Google Tasks (para el widget del móvil).

## 1. Crear el proyecto

1. Entra en <https://console.cloud.google.com> con tu cuenta de Google.
2. Arriba, en el selector de proyectos, pulsa **Nuevo proyecto**.
3. Ponle de nombre `Tareas Uni` y pulsa **Crear**.
4. Comprueba que el proyecto nuevo está seleccionado arriba.

## 2. Activar las APIs

1. Menú ☰ → **APIs y servicios** → **Biblioteca**.
2. Busca **Google Calendar API** → **Habilitar**.
3. Vuelve a la biblioteca, busca **Google Tasks API** → **Habilitar**.

## 3. Configurar la pantalla de consentimiento

Es la pantalla que te muestra Google al pedirte permiso.

1. Abre <https://console.cloud.google.com/auth/overview> (sección **Google Auth Platform**,
   antes llamada «Pantalla de consentimiento de OAuth») → **Comenzar**.
2. **Información de la app:** nombre `Tareas Uni` y tu email como correo de asistencia.
3. **Público:** elige **Externo**.
4. **Información de contacto:** tu email. Acepta la política y pulsa **Crear**.
5. *(Opcional, puedes saltarlo)* Ve a **Acceso a los datos**
   (<https://console.cloud.google.com/auth/scopes>) → **Agregar o quitar permisos**. Abajo, en
   «Agregar permisos manualmente», pega estas dos líneas. Para uso personal no hace falta: la app
   pide los permisos igualmente al conectar.
   ```
   https://www.googleapis.com/auth/calendar.app.created
   https://www.googleapis.com/auth/tasks
   ```
   Pulsa **Agregar a la tabla** → **Actualizar** → **Guardar**.
6. Ve a **Público** → **Usuarios de prueba** → **Add users** y añade tu propio Gmail.

## 4. Crear las credenciales (Client ID y Secret)

1. Ve a **Clientes** (o **Credenciales**) → **Crear cliente** (o **Crear credenciales → ID de
   cliente de OAuth**).
2. **Tipo de aplicación:** Aplicación web. **Nombre:** `Tareas Uni local`.
3. En **URIs de redireccionamiento autorizados** añade exactamente:
   ```
   http://localhost:3000/api/google/callback
   ```
4. Pulsa **Crear**. Copia el **ID de cliente** y el **Secreto del cliente**. Guarda el secreto
   ahora: Google puede no volver a mostrártelo.

## 5. Ponerlas en el `.env`

En la carpeta del proyecto, abre el archivo `.env`. Si no existe, copia `.env.example` y llámalo
`.env`. Rellena:

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

Reinicia la app (para el servidor con `Ctrl + C` y vuelve a lanzar `npm run dev`).

> El `.env` está en `.gitignore`: estas claves **nunca** se suben a GitHub.

## 6. Evitar tener que reconectar cada semana (recomendado)

Mientras la app está en modo **Prueba**, Google invalida el permiso a los **7 días** y tendrías
que volver a pulsar «Conectar». Para evitarlo:

1. Ve a **Público** → **Publicar app** → **Confirmar** (estado: *En producción*).
2. La próxima vez que conectes, Google mostrará el aviso **«Google no ha verificado esta app»**.
   Es normal: la app es tuya y solo la usas tú. Pulsa **Configuración avanzada** →
   **Ir a Tareas Uni (no seguro)**.

No hace falta pasar la verificación de Google: solo se exige si la app la usan más de 100
personas.

## 7. Conectar y sincronizar

1. Abre <http://localhost:3000/ajustes> → **Conectar con Google**.
2. Elige tu cuenta, marca los permisos y acepta.
3. De vuelta en la app, pulsa **Sincronizar ahora**. Se crearán la lista y el calendario
   **Universidad**.

## 8. Poner el widget en Android

1. Instala **Google Tasks** desde Play Store e inicia sesión con la misma cuenta.
2. Mantén pulsado un hueco de la pantalla de inicio → **Widgets** → **Tasks**.
3. Arrástralo junto al widget de Calendar y elige la lista **Universidad**.

## ¿Cómo funciona la sincronización?

| Acción | Qué pasa |
|---|---|
| Creas o editas una tarea en la app | Se envía a Google al momento, en segundo plano |
| Marcas una tarea como hecha en el widget | La app la marca como hecha al pulsar «Sincronizar ahora» |
| Creas una tarea en el widget | Se importa a la app al sincronizar |
| Borras una tarea en la app | Se borra también en Google |
| Tareas sin fecha | Van a Google Tasks, pero no al calendario |
| Tareas de tipo «Otro» | Van a Google Tasks, pero no al calendario |

El título, la fecha y las notas mandan siempre desde la app. Si los cambias en el móvil, se
sobrescriben en la siguiente sincronización.

## Problemas frecuentes

| Error | Solución |
|---|---|
| `redirect_uri_mismatch` | La URI del paso 4.3 debe ser exactamente `http://localhost:3000/api/google/callback` |
| `access_denied` / «no tienes acceso» | Añade tu Gmail como usuario de prueba (paso 3.6) o publica la app (paso 6) |
| «Google no reconoce tus claves» | Revisa el ID y el secreto del `.env` y reinicia `npm run dev` |
| «Falta activar la API…» | Repite el paso 2 con la API que falte |
| «El permiso ha caducado» | Vuelve a conectar desde Ajustes y haz el paso 6 |
