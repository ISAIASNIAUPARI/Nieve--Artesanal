'use client'

import dynamic from 'next/dynamic'
import type { Button } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'
import { useIsMobileView } from '../useIsMobileView'

type Tone = 'light' | 'dark' | 'onAccent'
type XKey = 'desktopX' | 'mobileX'
type YKey = 'desktopY' | 'mobileY'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Posición inicial (%) para un botón sin coordenadas todavía, una vez la
 * sección entra en modo canvas — separados horizontalmente, cerca de donde
 * vivía la fila/columna normal. */
function defaultPos(index: number): { x: number; y: number } {
  return { x: clamp(10 + index * 25, 0, 85), y: 80 }
}

// El arrastre libre (@dnd-kit) y las líneas guía de alineación solo hacen
// falta en edición — viven en un módulo aparte cargado con next/dynamic para
// que el sitio público nunca descargue @dnd-kit. Ver Obsidian, nota 11, Parte 9.
const EditableButtonsCanvas = dynamic(() => import('./EditableButtonsCanvas'), { ssr: false })

/**
 * Renderiza la barra de botones de una sección a partir del array `buttons`.
 * - buttons[0] → primario (relleno con el color de acento)
 * - buttons[1] → secundario (contorno)
 * - buttons[2..] → terciarios (fantasma)
 * Si no hay botones, no renderiza nada.
 *
 * `tone` = "dark" para secciones con fondo oscuro (Portada, Ubicación),
 *          "light" para el resto.
 *
 * Posicionamiento libre estilo Wix, con dos pares de coordenadas TOTALMENTE
 * independientes — mover un botón en una vista nunca toca los datos de la
 * otra:
 * - Desktop: `desktopX/Y`. Sin ellas → fila con flexbox, como siempre.
 * - Móvil (viewport real ≤768px, o el toggle 📱 del admin): `mobileX/Y`. Sin
 *   ellas → columna apilada centrada, como siempre.
 *
 * En modo edición se usa `EditableButtonsCanvas` (arrastre + líneas guía). En
 * el sitio público, si ya hay coordenadas guardadas para la vista activa, se
 * pintan como enlaces posicionados de solo lectura — sin @dnd-kit.
 */
export default function SectionButtons({
  buttons,
  tone = 'light',
  edit,
  align = 'flex-start',
  style,
  onReorder,
}: {
  buttons?: Button[]
  tone?: Tone
  edit?: boolean
  align?: React.CSSProperties['justifyContent']
  style?: React.CSSProperties
  onReorder?: (buttons: Button[]) => void
}) {
  const isMobile = useIsMobileView()
  const all = buttons || []
  const list = all.filter((b) => b.text?.trim() && b.href?.trim())
  if (list.length === 0) return null

  const onDark = tone === 'dark' || tone === 'onAccent'
  const fg = onDark ? '#fff' : 'var(--ink)'

  const styleFor = (index: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-block',
      padding: '14px 30px',
      borderRadius: 999,
      fontWeight: 600,
      fontSize: 15,
      lineHeight: 1.2,
    }
    if (index === 0) {
      if (tone === 'onAccent') return { ...base, background: '#fff', color: 'var(--accent)' }
      return { ...base, background: 'var(--accent)', color: '#fff' }
    }
    if (index === 1)
      return {
        ...base,
        background: 'transparent',
        border: `1px solid ${onDark ? '#fff' : 'var(--accent)'}`,
        color: onDark ? '#fff' : 'var(--accent)',
      }
    return {
      ...base,
      padding: '14px 22px',
      background: 'transparent',
      border: `1px solid ${onDark ? '#ffffff77' : 'var(--line)'}`,
      color: fg,
    }
  }

  const xKey: XKey = isMobile ? 'mobileX' : 'desktopX'
  const yKey: YKey = isMobile ? 'mobileY' : 'desktopY'
  const canvasMode = edit || list.some((b) => b[xKey] != null && b[yKey] != null)

  if (canvasMode) {
    if (edit) {
      return <EditableButtonsCanvas list={list} all={all} onReorder={onReorder} styleFor={styleFor} xKey={xKey} yKey={yKey} />
    }

    // Sitio público con coordenadas ya guardadas: enlaces posicionados de
    // solo lectura, sin @dnd-kit — el canvas cubre el área completa de la
    // sección (position:absolute, "bubblea" hasta el <section> con
    // position:relative más cercano) sin ocupar espacio en el flujo normal.
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        {list.map((b, i) => {
          const pos = { x: b[xKey] ?? defaultPos(i).x, y: b[yKey] ?? defaultPos(i).y }
          return (
            <a
              key={b.id}
              href={resolveButtonHref(b)}
              target={b.hrefType === 'url' ? '_blank' : undefined}
              rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
              style={{ ...styleFor(i), position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, pointerEvents: 'auto' }}
            >
              {b.text}
            </a>
          )
        })}
      </div>
    )
  }

  const plainButtons = list.map((b, i) => (
    <a
      key={b.id}
      href={resolveButtonHref(b)}
      target={b.hrefType === 'url' ? '_blank' : undefined}
      rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
      style={styleFor(i)}
    >
      {b.text}
    </a>
  ))

  if (isMobile) {
    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>{plainButtons}</div>
  }

  return <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: align, ...style }}>{plainButtons}</div>
}
