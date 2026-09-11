'use client'

import { useRef } from 'react'
import type { Button } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'
import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
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
 * En modo edición el canvas de la vista activa está siempre encendido (para
 * poder arrastrar sin un paso previo); en el sitio público solo si ya hay
 * coordenadas guardadas para esa vista. El canvas cubre el área COMPLETA de
 * la sección (no solo donde vivía la fila) — el cliente tiene control total
 * para evitar tapar el título o cualquier otro contenido, igual que en Wix.
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
    return (
      <FreeCanvas list={list} all={all} edit={edit} onReorder={onReorder} styleFor={styleFor} xKey={xKey} yKey={yKey} />
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

// ─── Canvas de posición libre (desktop y móvil comparten la misma mecánica) ──

function FreeCanvas({
  list,
  all,
  edit,
  onReorder,
  styleFor,
  xKey,
  yKey,
}: {
  list: Button[]
  all: Button[]
  edit?: boolean
  onReorder?: (buttons: Button[]) => void
  styleFor: (i: number) => React.CSSProperties
  xKey: XKey
  yKey: YKey
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const posFor = (b: Button, i: number) => ({
    x: b[xKey] ?? defaultPos(i).x,
    y: b[yKey] ?? defaultPos(i).y,
  })

  const handleDragEnd = ({ active, delta }: DragEndEvent) => {
    if (!onReorder || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const idx = list.findIndex((b) => b.id === active.id)
    if (idx === -1) return
    const current = posFor(list[idx], idx)
    const newX = clamp(current.x + (delta.x / rect.width) * 100, 0, 100)
    const newY = clamp(current.y + (delta.y / rect.height) * 100, 0, 100)
    onReorder(all.map((b) => (b.id === active.id ? { ...b, [xKey]: newX, [yKey]: newY } : b)))
  }

  // El canvas cubre TODO el área de la sección (position:absolute + inset:0,
  // "bubblea" hasta el <section> con position:relative más cercano) sin
  // ocupar espacio en el flujo normal — el resto del contenido (título,
  // descripción, panel de edición) sigue determinando el alto de la sección
  // como siempre. pointerEvents:none en el contenedor + 'auto' en cada botón
  // para que el área vacía del canvas no bloquee clics en lo que hay debajo.
  const canvas = (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
      {list.map((b, i) => {
        const pos = posFor(b, i)
        return edit ? (
          <DraggableCanvasButton key={b.id} button={b} pos={pos} pillStyle={styleFor(i)} />
        ) : (
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

  if (!edit) return canvas

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
      {canvas}
    </DndContext>
  )
}

function DraggableCanvasButton({
  button: b,
  pos,
  pillStyle,
}: {
  button: Button
  pos: { x: number; y: number }
  pillStyle: React.CSSProperties
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: b.id })

  // Un <div> a propósito, no un <a> — en edición este elemento SOLO sirve para
  // arrastrar. Un <a href> real, aunque el click lleve preventDefault, puede
  // arrastrar consigo comportamientos del navegador (foco, scroll-to-anchor)
  // que molestaban al intentar mover el botón. Sin href no hay nada a donde
  // navegar; el destino real (resolveButtonHref) solo se usa en el <a> de
  // verdad que ve el visitante del sitio público.
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...pillStyle,
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: isDragging ? 10 : 1,
      }}
    >
      {b.text}
    </div>
  )
}
