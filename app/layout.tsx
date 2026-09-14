import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
