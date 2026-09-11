'use client'

import type { Button, MobileZone } from '@/lib/types'
import { resolveButtonHref } from '@/lib/types'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useIsMobileView } from '../useIsMobileView'

type Tone = 'light' | 'dark' | 'onAccent'

const ZONE_POSITION: Record<MobileZone, React.CSSProperties> = {
  'top-left': { top: 16, left: 16 },
  'top-center': { top: 16, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 },
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
 * Si `edit` y `onReorder` están presentes, cada botón se vuelve arrastrable
 * (dnd-kit, eventos de puntero — no el drag&drop nativo del navegador) y
 * soltarlo reordena `buttons[]`. El reorden se calcula sobre el array
 * COMPLETO (no solo los botones con texto/destino ya completos que se
 * alcanzan a renderizar), para no perder la posición relativa de un botón
 * a medio llenar que por ahora no se muestra como pastilla.
 *
 * En vista móvil (real ≤768px, o el toggle 📱 del admin), un botón con
 * `mobileZone` se ancla con position:absolute a esa esquina de la sección
 * (el `<section>` del componente padre necesita `position:relative` — ya
 * lo tienen los 6 que usan este componente). Un botón SIN mobileZone sigue
 * el comportamiento normal (fila/apilado); si NINGÚN botón tiene zona, el
 * móvil se ve exactamente igual que antes de esta función existir.
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
  const draggable = Boolean(edit && onReorder)

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

  const zoned = isMobile ? list.filter((b) => b.mobileZone) : []
  const flowing = isMobile ? list.filter((b) => !b.mobileZone) : list

  // distance:8 deja que un clic normal (sin mover el mouse) no dispare un
  // arrastre — el mismo patrón que ya usa ButtonsEditor.tsx.
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

  const row =
    flowingPills.length === 0 ? null : (
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: align, ...style }}>{flowingPills}</div>
    )

  const rowNode =
    row && draggable ? (
      // restrictToParentElement: el botón arrastrado no puede salir del contenedor
      // de la fila (el mismo ancho que el contenido de la sección) — sin esto, se
      // podía arrastrar hacia la derecha "al infinito", fuera del área visible.
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext items={flowing.map((b) => b.id)} strategy={rectSortingStrategy}>
          {row}
        </SortableContext>
      </DndContext>
    ) : (
      row
    )

  if (zoned.length === 0) return rowNode

  return (
    <>
      {rowNode}
      {zoned.map((b) => (
        <a
          key={b.id}
          href={resolveButtonHref(b)}
          target={b.hrefType === 'url' ? '_blank' : undefined}
          rel={b.hrefType === 'url' ? 'noreferrer' : undefined}
          onClick={(e) => edit && e.preventDefault()}
          style={{
            ...styleFor(list.indexOf(b)),
            position: 'absolute',
            zIndex: 5,
            ...ZONE_POSITION[b.mobileZone as MobileZone],
          }}
        >
          {b.text}
        </a>
      ))}
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
