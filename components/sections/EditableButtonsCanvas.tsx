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

type XKey = 'desktopX' | 'mobileX'
type YKey = 'desktopY' | 'mobileY'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function defaultPos(index: number): { x: number; y: number } {
  return { x: clamp(10 + index * 25, 0, 85), y: 80 }
}

const SNAP_PX = 6
const GUIDE_COLOR = '#00e676'

type CanvasRect = { left: number; top: number; width: number; height: number }
type Guide = { orientation: 'vertical' | 'horizontal'; pos: number; start: number; end: number }

const guidesEqual = (a: Guide[], b: Guide[]) =>
  a.length === b.length && a.every((g, i) => g.orientation === b[i].orientation && g.pos === b[i].pos)

/**
 * Todo lo que necesita @dnd-kit (arrastre libre + líneas guía de alineación)
 * vive en este archivo APARTE, cargado con next/dynamic({ssr:false}) desde
 * SectionButtons.tsx — solo se importa de verdad cuando `edit` es true, es
 * decir, solo dentro de /admin. El sitio público nunca descarga @dnd-kit ni
 * este componente. Ver Obsidian, nota 11, Parte 9.
 */
export default function EditableButtonsCanvas({
  list,
  all,
  onReorder,
  styleFor,
  xKey,
  yKey,
}: {
  list: Button[]
  all: Button[]
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[snapModifier, restrictToParentElement]}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
        {guides.map((g, i) => (
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
        {list.map((b, i) => (
          <DraggableCanvasButton key={b.id} button={b} pos={posFor(b, i)} pillStyle={styleFor(i)} href={resolveButtonHref(b)} />
        ))}
      </div>
    </DndContext>
  )
}

function DraggableCanvasButton({
  button: b,
  pos,
  pillStyle,
  href,
}: {
  button: Button
  pos: { x: number; y: number }
  pillStyle: React.CSSProperties
  href: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: b.id })

  // Un <div> a propósito, no un <a> — en edición este elemento SOLO sirve para
  // arrastrar. Un <a href> real, aunque el click lleve preventDefault, puede
  // arrastrar consigo comportamientos del navegador (foco, scroll-to-anchor)
  // que molestaban al intentar mover el botón. Sin href no hay nada a donde
  // navegar; el destino real (href, ya resuelto) solo se usa en el <a> de
  // verdad que ve el visitante del sitio público.
  return (
    <div
      ref={setNodeRef}
      data-canvas-btn-id={b.id}
      title={href}
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
