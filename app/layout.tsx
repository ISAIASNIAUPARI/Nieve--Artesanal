import type { Metadata } from 'next'
import Script from 'next/script'
import { getTheme } from '@/lib/content'
import type { Theme } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Nieve Artesanal',
  description: 'Gelato, sorbetes y postres helados elaborados a diario con fruta de temporada, cacao real y crema fresca.',
}

/**
 * --color-primary/secondary/accent como inline style en <html> — antes de
 * cualquier CSS, así no hay parpadeo con el color viejo. globals.css los
 * conecta con --accent/--bg/--ink (las variables que ya usa todo el sitio),
 * así que ningún componente necesita tocarse para reflejar el tema.
 */
function themeStyle(theme: Theme): React.CSSProperties {
  return {
    '--color-primary': theme.colorPrimary,
    '--color-secondary': theme.colorSecondary,
    '--color-accent': theme.colorAccent,
  } as React.CSSProperties
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = getTheme()
  return (
    <html lang="es" style={themeStyle(theme)}>
      <head>
        {/* Ahorra la vuelta DNS+TLS la primera vez que una sección de producto 3D
            pide el modelo (Cloudinary) o el script del visor (jsdelivr). */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body>
        {/* beforeInteractive solo se permite en el layout raíz — por eso vive
            aquí y no dentro de ProductViewer3D.tsx. Registra el custom element
            <model-viewer> antes de que React hidrate, así no hay flash sin
            estilos la primera vez que una página tiene una sección 3D. */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"
          type="module"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  )
}
