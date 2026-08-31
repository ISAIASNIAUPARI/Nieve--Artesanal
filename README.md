# Nieve Artesanal

Web construida con [Next.js](https://nextjs.org) (App Router). El contenido vive como
archivos JSON dentro del propio repo (`/content`), y se edita desde un panel visual en
`/admin` — estilo Wix: clic en cualquier texto o imagen, se edita ahí mismo, "Guardar"
hace commit a GitHub y Vercel redespliega el sitio automáticamente.

## El flujo

```
/admin (contraseña) → editar en la página real → Guardar
        → commit a GitHub (content/*.json + public/images/uploads/*)
        → Vercel detecta el push → redeploy (~45-60s)
        → el dominio público muestra el cambio
```

No hay base de datos externa ni CMS de terceros: el repo **es** la fuente de verdad.

## Desarrollo local

```bash
npm install
npm run dev
```

- Sitio público: `http://localhost:3000`
- Panel de edición: `http://localhost:3000/admin`

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

- `ADMIN_PASSWORD` — contraseña para entrar a `/admin`
- `GITHUB_TOKEN` — Personal Access Token de GitHub (scope `repo`), solo se usa en el servidor
- `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` — el repo al que se hace commit al guardar

En Vercel, configura las mismas variables en Project Settings → Environment Variables
(las de servidor no llevan `NEXT_PUBLIC_`, así que nunca llegan al navegador).

**Importante:** para que "Guardar" en `/admin` termine actualizando el dominio público,
este proyecto de Vercel debe estar conectado a este mismo repo de GitHub con auto-deploy
en la rama `main` — así funciona por defecto cuando importas un repo en Vercel.

## Estructura

- `app/(site)/` — sitio público (lee de `/content` vía `lib/content.ts`)
- `app/admin/` — panel de edición (protegido por `middleware.ts`)
- `app/api/admin/` — login, logout y guardado (commit a GitHub vía `lib/github.ts`)
- `components/` — un componente por sección; cada uno acepta `edit` para volverse editable
- `components/editable/` — `EditableText` y `EditableImage`, las piezas reutilizables del editor
- `content/` — el contenido real del sitio, un JSON por sección
- `public/images/` — imágenes; las subidas desde `/admin` caen en `public/images/uploads/`

## Limitaciones de este prototipo

- Los enlaces de los botones (`primaryButtonLink`, etc.) no son editables desde `/admin`
  todavía — se cambian editando el JSON en `content/`.
- Sin sistema de "deshacer": cada guardado es un commit nuevo, revertir es un `git revert`.
- Una sola sesión de admin a la vez conceptualmente — no hay bloqueo si dos personas
  editan y guardan al mismo tiempo (el segundo guardado simplemente sobreescribe).
