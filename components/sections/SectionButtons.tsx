'use client'

import { useRef, useState } from 'react'
import type { Button } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
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

// ─── Líneas guía de alineación (estilo Figma/Wix) ──────────────────────────

/** Distancia (px) dentro de la cual dos botones se consideran "alineados" y
 * el arrastrado se ajusta (snap) exacto a esa alineación. */
const SNAP_PX = 6
const GUIDE_COLOR = '#00e676'

type CanvasRect = { left: number; top: number; width: number; height: number }
type Guide = { orientation: 'vertical' | 'horizontal'; pos: number; start: number; end: number }

const guidesEqual = (a: Guide[], b: Guide[]) =>
  a.length === b.length && a.every((g, i) => g.orientation === b[i].orientation && g.pos === b[i].pos)

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
 * Al arrastrar, si el borde/centro de un botón se acerca al de otro botón de
 * la misma sección, aparece una línea guía verde y el botón se ajusta exacto
 * a esa alineación (como las guías inteligentes de Figma/Wix).
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
  // Rects (relativos al canvas, en px) de TODOS los botones, medidos una sola
  // vez al empezar el arrastre — sirven de referencia fija mientras dura el
  // drag, para comparar al botón arrastrado contra dónde estaban los demás.
  const startRectsRef = useRef<Record<string, CanvasRect>>({})
  const [guides, setGuides] = useState<Guide[]>([])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const posFor = (b: Button, i: number) => ({
    x: b[xKey] ?? defaultPos(i).x,
    y: b[yKey] ?? defaultPos(i).y,
  })

  const handleDragStart = ({ active }: DragStartEvent) => {
    const containerEl = containerRef.current
    if (!containerEl) return
    const containerRect = containerEl.getBoundingClientRect()
    const rects: Record<string, CanvasRect> = {}
    containerEl.querySelectorAll<HTMLElement>('[data-canvas-btn-id]').forEach((el) => {
      const id = el.dataset.canvasBtnId
      if (!id) return
      const r = el.getBoundingClientRect()
      rects[id] = { left: r.left - containerRect.left, top: r.top - containerRect.top, width: r.width, height: r.height }
    })
    startRectsRef.current = rects
  }

  // Modifier de dnd-kit: recibe el transform (delta en px) que el usuario ya
  // arrastró y puede devolver uno ajustado — aquí es donde vive el snap. Se
  // ejecuta en cada frame del arrastre, así que también sirve para mantener
  // las líneas guía en vivo (ver comentario más abajo sobre el setState).
  const snapModifier: Modifier = ({ transform, active }) => {
    if (!active) return transform
    const rects = startRectsRef.current
    const dragged = rects[active.id as string]
    if (!dragged) return transform

    const liveLeft = dragged.left + transform.x
    const liveTop = dragged.top + transform.y
    const liveRight = liveLeft + dragged.width
    const liveBottom = liveTop + dragged.height
    const liveCenterX = liveLeft + dragged.width / 2
    const liveCenterY = liveTop + dragged.height / 2

    let bestX: { delta: number; guide: Guide } | null = null
    let bestY: { delta: number; guide: Guide } | null = null

    for (const [id, r] of Object.entries(rects)) {
      if (id === active.id) continue
      const sLeft = r.left
      const sRight = r.left + r.width
      const sCenterX = r.left + r.width / 2
      const sTop = r.top
      const sBottom = r.top + r.height
      const sCenterY = r.top + r.height / 2

      for (const [live, target] of [
        [liveLeft, sLeft],
        [liveCenterX, sCenterX],
        [liveRight, sRight],
      ] as const) {
        const d = target - live
        if (Math.abs(d) <= SNAP_PX && (!bestX || Math.abs(d) < Math.abs(bestX.delta))) {
          bestX = {
            delta: d,
            guide: {
              orientation: 'vertical',
              pos: target,
              start: Math.min(liveTop, sTop) - 12,
              end: Math.max(liveBottom, sBottom) + 12,
            },
          }
        }
      }

      for (const [live, target] of [
        [liveTop, sTop],
        [liveCenterY, sCenterY],
        [liveBottom, sBottom],
      ] as const) {
        const d = target - live
        if (Math.abs(d) <= SNAP_PX && (!bestY || Math.abs(d) < Math.abs(bestY.delta))) {
          bestY = {
            delta: d,
            guide: {
              orientation: 'horizontal',
              pos: target,
              start: Math.min(liveLeft, sLeft) - 12,
              end: Math.max(liveRight, sRight) + 12,
            },
          }
        }
      }
    }

    const nextGuides: Guide[] = []
    let adjustedX = transform.x
    let adjustedY = transform.y
    if (bestX) {
      adjustedX += bestX.delta
      nextGuides.push(bestX.guide)
    }
    if (bestY) {
      adjustedY += bestY.delta
      nextGuides.push(bestY.guide)
    }

    setGuides((prev) => (guidesEqual(prev, nextGuides) ? prev : nextGuides))

    return { ...transform, x: adjustedX, y: adjustedY }
  }

  const handleDragEnd = ({ active, delta }: DragEndEvent) => {
    setGuides([])
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
      {edit &&
        guides.map((g, i) => (
          <div
            key={i}
            style={
              g.orientation === 'vertical'
                ? {
                    position: 'absolute',
                    left: g.pos,
                    top: g.start,
                    width: 1,
                    height: g.end - g.start,
                    background: GUIDE_COLOR,
                    boxShadow: '0 0 3px 1px #00000066',
                    zIndex: 20,
                    pointerEvents: 'none',
                  }
                : {
                    position: 'absolute',
                    top: g.pos,
                    left: g.start,
                    height: 1,
                    width: g.end - g.start,
                    background: GUIDE_COLOR,
                    boxShadow: '0 0 3px 1px #00000066',
                    zIndex: 20,
                    pointerEvents: 'none',
                  }
            }
          />
        ))}
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[snapModifier, restrictToParentElement]}
    >
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
      data-canvas-btn-id={b.id}
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
