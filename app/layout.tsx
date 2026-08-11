import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nieve Artesanal',
  description: 'Gelato, sorbetes y postres helados elaborados a diario con fruta de temporada, cacao real y crema fresca.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
