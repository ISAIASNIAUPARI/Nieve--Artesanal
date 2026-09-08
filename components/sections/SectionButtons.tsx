'use client'

import type { Button } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'

type Tone = 'light' | 'dark'

/**
 * Renderiza la barra de botones de una sección a partir del array `buttons`.
 * - buttons[0] → primario (relleno con el color de acento)
 * - buttons[1] → secundario (contorno)
 * - buttons[2..] → terciarios (fantasma)
 * Si no hay botones, no renderiza nada.
 *
 * `tone` = "dark" para secciones con fondo oscuro (Portada, Ubicación),
 *          "light" para el resto.
 */
export default function SectionButtons({
  buttons,
  tone = 'light',
  edit,
  align = 'flex-start',
  style,
}: {
  buttons?: Button[]
  tone?: Tone
  edit?: boolean
  align?: React.CSSProperties['justifyContent']
  style?: React.CSSProperties
}) {
  const list = (buttons || []).filter((b) => b.text?.trim() && b.href?.trim())
  if (list.length === 0) return null

  const fg = tone === 'dark' ? '#fff' : 'var(--ink)'

  const styleFor = (index: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-block',
      padding: '14px 30px',
      borderRadius: 999,
      fontWeight: 600,
      fontSize: 15,
      lineHeight: 1.2,
    }
    if (index === 0) return { ...base, background: 'var(--accent)', color: '#fff' }
    if (index === 1)
      return {
        ...base,
        background: 'transparent',
        border: `1px solid ${tone === 'dark' ? '#fff' : 'var(--accent)'}`,
        color: tone === 'dark' ? '#fff' : 'var(--accent)',
      }
    return {
      ...base,
      padding: '14px 22px',
      background: 'transparent',
      border: `1px solid ${tone === 'dark' ? '#ffffff55' : 'var(--line)'}`,
      color: fg,
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: align, ...style }}>
      {list.map((b, i) => (
        <a
          key={b.id}
          href={resolveButtonHref(b)}
          target={b.hrefType === 'url' ? '_blank' : undefined}
          rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
          onClick={(e) => edit && e.preventDefault()}
          style={styleFor(i)}
        >
          {b.text}
        </a>
      ))}
    </div>
  )
}
