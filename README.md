# Nieve Artesanal

Web de Nieve Artesanal construida con [Next.js](https://nextjs.org) (App Router) y contenido editable desde un panel [Sanity](https://www.sanity.io) en `/studio`.

## Desarrollo local

```bash
npm install
npm run dev
```

El panel de edición vive en `http://localhost:3000/studio`.

## Estructura

- `app/(site)/` — páginas públicas del sitio (con su propio CSS global).
- `app/studio/` — el panel de Sanity, colgado del layout raíz para no heredar el CSS del sitio.
- `components/` — componentes de cada sección de la web.
- `sanity/schemaTypes/` — un archivo por sección del panel. Esto **es** la interfaz de `/studio`: no se configura desde Sanity, se define aquí.
- `sanity/structure.ts` — el menú lateral del panel: orden, números y emojis.
- `scripts/seed.mjs` — carga el contenido inicial (imágenes, vídeo y textos) en un proyecto de Sanity nuevo.

## Variables de entorno

Ver `.env.local` (no se sube al repositorio):

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_WRITE_TOKEN` — solo para `npm run seed`, nunca se expone al navegador.
