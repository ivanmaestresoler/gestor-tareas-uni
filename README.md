# 📚 Tareas Uni

Gestor personal de tareas, entregas y exámenes de la universidad. Funciona **en local**, con
una sección destacada para las tareas **sin fecha límite** (las que Moodle no muestra en su
calendario y es fácil olvidar).

> 🚧 En desarrollo. Estado actual: **Fase 1 completada** (gestor de tareas base).
> Próximamente: importación desde Moodle y sincronización con Google.

## ✨ Funcionalidades

- Crear, editar, borrar y marcar como hechas tus tareas: título, asignatura, tipo
  (entrega / examen / otro), fecha y hora opcionales, prioridad, estado y notas.
- **Vista de lista** con búsqueda (no distingue tildes) y filtros por asignatura, tipo, prioridad
  y estado. Los filtros se guardan en la URL.
- Secciones **Atrasadas**, **Próximas** y **Hechas**, y un panel destacado **Sin fecha**.
- **Vista de calendario** mensual. Pulsa un día para crear una tarea en esa fecha.
- Diseño responsive (pensado también para el móvil) con modo oscuro automático.

## 🛠️ Tecnologías

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | SQLite (archivo local) con [Drizzle ORM](https://orm.drizzle.team) + libSQL |
| Validación | Zod |
| Fechas | date-fns |
| Tests | Vitest |

**¿Por qué SQLite?** Es una app personal que se usa en local: SQLite guarda todo en un único
archivo (`data/tareas.db`), es gratis y no hay que instalar ni configurar ningún servidor de base
de datos.

## 🚀 Instalación

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
git clone https://github.com/ivanmaestresoler/gestor-tareas-uni.git
cd gestor-tareas-uni
npm install
cp .env.example .env      # opcional en la fase 1
npm run db:seed           # opcional: crea tareas de ejemplo
npm run dev
```

Abre <http://localhost:3000>. La base de datos se crea sola la primera vez que arrancas la app.

## 📜 Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app en modo desarrollo |
| `npm test` | Ejecuta los tests |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run lint` | Revisa el código con ESLint |
| `npm run db:seed` | Crea tareas de ejemplo (`-- --reset` para reemplazarlas) |
| `npm run db:generate` | Genera una migración tras cambiar `src/lib/db/schema.ts` |
| `npm run db:studio` | Abre Drizzle Studio para ver la base de datos |

## 📁 Estructura

```
src/
├─ app/                  # Páginas: lista (/) y calendario (/calendario)
├─ components/           # Componentes de interfaz (tarjetas, formulario, filtros, calendario)
├─ lib/
│  ├─ db/                # Esquema, conexión y migraciones automáticas
│  ├─ tasks/             # Validación, filtros, consultas y Server Actions
│  ├─ calendar.ts        # Lógica de la cuadrícula mensual
│  └─ format.ts          # Formato de fechas en español
└─ instrumentation.ts    # Aplica las migraciones al arrancar
drizzle/                 # Migraciones SQL generadas
scripts/seed.mts         # Datos de ejemplo
```

## 🗺️ Hoja de ruta

- [x] **Fase 1:** gestor de tareas con lista, filtros, «Sin fecha» y calendario
- [ ] **Fase 2:** importar asignaturas y tareas de Moodle (incluidas las que no tienen fecha)
- [ ] **Fase 3:** sincronizar con Google (Calendar y widget en el móvil)

## 🔒 Privacidad

La app está pensada para un único usuario en su propio ordenador y no tiene sistema de login.
Tus credenciales van en `.env` y tus datos en `data/`. Ninguno de los dos se sube a Git.
