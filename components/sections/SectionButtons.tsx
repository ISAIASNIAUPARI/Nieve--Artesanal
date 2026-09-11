'use client'

import { useRef } from 'react'
import type { Button, MobileZone } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useIsMobileView } from '../useIsMobileView'

type Tone = 'light' | 'dark' | 'onAccent'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const ZONE_POSITION: Record<MobileZone, React.CSSProperties> = {
  'top-left': { top: '10%', left: '5%' },
  'top-center': { top: '10%', left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: '10%', right: '5%' },
  'bottom-left': { bottom: '10%', left: '5%' },
  'bottom-right': { bottom: '10%', right: '5%' },
}

/** Posición inicial (%) para un botón sin desktopX/Y todavía, una vez la sección
 * entra en modo canvas — separados horizontalmente, cerca de donde vivía la fila. */
function defaultDesktopPos(index: number): { x: number; y: number } {
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
 * Tres modos de posicionamiento, mutuamente excluyentes y completamente
 * independientes entre sí (mover un botón en uno nunca toca los datos del otro):
 *
 * 1. **Móvil** (viewport real ≤768px, o el toggle 📱 del admin): un botón con
 *    `mobileZone` se ancla a esa esquina dentro de un contenedor chico y
 *    dedicado (`position:relative; min-height:120px`) — no el `<section>`
 *    completo, para no terminar encima del título o la descripción. Un botón
 *    sin zona se apila en columna centrada, arrastrable para reordenar.
 * 2. **Desktop, modo canvas** (edición, o ya hay al menos un botón con
 *    `desktopX/Y` guardado): cada botón se puede arrastrar libremente —
 *    estilo Wix — a cualquier punto dentro del área completa de la sección.
 * 3. **Desktop, fila normal**: ningún botón tiene `desktopX/Y` y no se está
 *    editando — se ve exactamente como siempre (flexbox en fila).
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

  if (isMobile) {
    return <MobileButtons list={list} all={all} edit={edit} onReorder={onReorder} styleFor={styleFor} />
  }

  const canvasMode = edit || list.some((b) => b.desktopX != null && b.desktopY != null)
  if (canvasMode) {
    return <DesktopCanvas list={list} all={all} edit={edit} onReorder={onReorder} styleFor={styleFor} />
  }

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: align, ...style }}>
      {list.map((b, i) => (
        <a
          key={b.id}
          href={resolveButtonHref(b)}
          target={b.hrefType === 'url' ? '_blank' : undefined}
          rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
          style={styleFor(i)}
        >
          {b.text}
        </a>
      ))}
    </div>
  )
}

// ─── Desktop: posición libre estilo Wix ────────────────────────────────────

function DesktopCanvas({
  list,
  all,
  edit,
  onReorder,
  styleFor,
}: {
  list: Button[]
  all: Button[]
  edit?: boolean
  onReorder?: (buttons: Button[]) => void
  styleFor: (i: number) => React.CSSProperties
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const posFor = (b: Button, i: number) => ({
    x: b.desktopX ?? defaultDesktopPos(i).x,
    y: b.desktopY ?? defaultDesktopPos(i).y,
  })

  const handleDragEnd = ({ active, delta }: DragEndEvent) => {
    if (!onReorder || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const idx = list.findIndex((b) => b.id === active.id)
    if (idx === -1) return
    const current = posFor(list[idx], idx)
    const newX = clamp(current.x + (delta.x / rect.width) * 100, 0, 100)
    const newY = clamp(current.y + (delta.y / rect.height) * 100, 0, 100)
    onReorder(all.map((b) => (b.id === active.id ? { ...b, desktopX: newX, desktopY: newY } : b)))
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

  return (
    <a
      ref={setNodeRef}
      href={resolveButtonHref(b)}
      draggable={false}
      onClick={(e) => e.preventDefault()}
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
        zIndex: isDragging ? 10 : 1,
      }}
    >
      {b.text}
    </a>
  )
}

// ─── Móvil: zona fija o columna apilada ────────────────────────────────────

function MobileButtons({
  list,
  all,
  edit,
  onReorder,
  styleFor,
}: {
  list: Button[]
  all: Button[]
  edit?: boolean
  onReorder?: (buttons: Button[]) => void
  styleFor: (i: number) => React.CSSProperties
}) {
  const zoned = list.filter((b) => b.mobileZone)
  const flowing = list.filter((b) => !b.mobileZone)
  const draggable = Boolean(edit && onReorder)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!onReorder || !over || active.id === over.id) return
    const oldIndex = all.findIndex((b) => b.id === active.id)
    const newIndex = all.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(all, oldIndex, newIndex))
  }

  const flowingPills = flowing.map((b) => {
    const i = list.indexOf(b)
    return draggable ? (
      <SortableButtonPill key={b.id} button={b} pillStyle={styleFor(i)} />
    ) : (
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
    )
  })

  const flowRow =
    flowingPills.length === 0 ? null : (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>{flowingPills}</div>
    )

  const flowNode =
    flowRow && draggable ? (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext items={flowing.map((b) => b.id)} strategy={rectSortingStrategy}>
          {flowRow}
        </SortableContext>
      </DndContext>
    ) : (
      flowRow
    )

  if (zoned.length === 0) return flowNode

  return (
    <>
      {flowNode}
      {/* Contenedor chico y dedicado (no el <section> completo) — así una zona
          "superior" no termina encima del título o la descripción de la sección. */}
      <div style={{ position: 'relative', width: '100%', minHeight: 120 }}>
        {zoned.map((b) => {
          const i = list.indexOf(b)
          return (
            <a
              key={b.id}
              href={resolveButtonHref(b)}
              target={b.hrefType === 'url' ? '_blank' : undefined}
              rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
              onClick={(e) => edit && e.preventDefault()}
              style={{ ...styleFor(i), position: 'absolute', ...ZONE_POSITION[b.mobileZone as MobileZone] }}
            >
              {b.text}
            </a>
          )
        })}
      </div>
    </>
  )
}

function SortableButtonPill({ button: b, pillStyle }: { button: Button; pillStyle: React.CSSProperties }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id })

  return (
    <a
      ref={setNodeRef}
      href={resolveButtonHref(b)}
      target={b.hrefType === 'url' ? '_blank' : undefined}
      rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
      // El link nativo del navegador ("arrastrar para copiar el enlace") se
      // desactiva con draggable={false} — dnd-kit usa eventos de puntero
      // propios, así que los dos no compiten por el gesto de arrastre.
      draggable={false}
      onClick={(e) => e.preventDefault()}
      {...attributes}
      {...listeners}
      style={{
        ...pillStyle,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      {b.text}
    </a>
  )
}
