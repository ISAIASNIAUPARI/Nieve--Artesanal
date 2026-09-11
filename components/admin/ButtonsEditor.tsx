'use client'

import type { Button, HrefType, MobileZone } from '@/lib/types'
import { MAX_BUTTONS, MOBILE_ZONES, PAGE_ANCHORS, isSafeHref, newButton, resolveButtonHref } from '@/lib/types'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEdit } from './EditProvider'

const TYPE_LABELS: Record<HrefType, string> = {
  anchor: 'Misma página',
  url: 'URL externa',
  whatsapp: 'WhatsApp',
  phone: 'Teléfono',
}

const box: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  color: '#fff',
  background: '#0000008c',
  border: '1px solid #ffffff2b',
  borderRadius: 12,
  padding: 14,
  margin: '18px 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: 520,
  textAlign: 'left',
}

const field: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid #ffffff3b',
  background: '#00000066',
  color: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
}

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  border: '1px solid #ffffff3b',
  background: enabled ? '#ffffff17' : '#ffffff08',
  color: enabled ? '#fff' : '#ffffff55',
  borderRadius: 8,
  width: 30,
  height: 30,
  cursor: enabled ? 'pointer' : 'default',
  fontSize: 14,
  lineHeight: 1,
})

/**
 * Editor de la barra de botones de una sección (0 a 5 botones).
 * Es "controlado": recibe `buttons` y llama `onChange` con el array nuevo
 * (añadir, borrar, reordenar, editar). El commit al JSON lo hace "Guardar".
 *
 * El reorden tiene dos caminos, ambos terminan en el mismo `onChange(next)`:
 * las flechas ↑↓ de siempre, y arrastrar la tarjeta desde su asa (⠿). El
 * arrastre usa dnd-kit con el "drag handle" en un elemento aparte — no en la
 * tarjeta completa — para que seguir pudiendo hacer clic y seleccionar texto
 * dentro de los campos (texto, destino) sin que se interprete como un intento
 * de arrastre.
 */
export default function ButtonsEditor({
  buttons,
  onChange,
  sectionLabel,
  max = MAX_BUTTONS,
}: {
  buttons: Button[]
  onChange: (buttons: Button[]) => void
  sectionLabel: string
  max?: number
}) {
  const { viewMode } = useEdit()
  const update = (id: string, patch: Partial<Button>) =>
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const remove = (id: string) => onChange(buttons.filter((b) => b.id !== id))

  const move = (index: number, dir: -1 | 1) => {
    const next = [...buttons]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const add = () => {
    if (buttons.length >= max) return
    onChange([...buttons, newButton()])
  }

  // distance:4 evita que un simple clic (sin mover el mouse) se confunda con un
  // arrastre — así un clic normal en el asa sigue funcionando como clic.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = buttons.findIndex((b) => b.id === active.id)
    const newIndex = buttons.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(buttons, oldIndex, newIndex))
  }

  return (
    <div style={box} onClick={(e) => e.stopPropagation()}>
      <strong style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Botones de «{sectionLabel}» ({buttons.length}/{max})
      </strong>

      {buttons.length === 0 && <span style={{ opacity: 0.6 }}>Esta sección no tiene botones.</span>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={buttons.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {buttons.map((b, i) => (
            <SortableButtonRow
              key={b.id}
              button={b}
              index={i}
              total={buttons.length}
              mobileMode={viewMode === 'mobile'}
              onUpdate={(patch) => update(b.id, patch)}
              onRemove={() => remove(b.id)}
              onMove={(dir) => move(i, dir)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={add}
        disabled={buttons.length >= max}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px dashed #ffffff55',
          background: 'transparent',
          color: buttons.length >= max ? '#ffffff55' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: buttons.length >= max ? 'default' : 'pointer',
        }}
      >
        + Añadir botón
      </button>
    </div>
  )
}

/** Posición de cada punto dentro del recuadro de 100×64 del selector de zona. */
const DOT_POSITION: Record<MobileZone, React.CSSProperties> = {
  'top-left': { top: 4, left: 4 },
  'top-center': { top: 4, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 4, right: 4 },
  'bottom-left': { bottom: 4, left: 4 },
  'bottom-right': { bottom: 4, right: 4 },
}

/**
 * Mini mapa de la pantalla móvil con un punto clickeable en cada una de las 5 zonas.
 * Clic de nuevo sobre la zona ya elegida la quita (vuelve al apilado normal).
 */
function MobileZonePicker({ value, onChange }: { value?: MobileZone; onChange: (zone: MobileZone | undefined) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ opacity: 0.7 }}>Zona en móvil</span>
      <div
        style={{
          position: 'relative',
          width: 100,
          height: 64,
          border: '1px solid #ffffff3b',
          borderRadius: 8,
          background: '#00000066',
        }}
      >
        {MOBILE_ZONES.map((z) => (
          <button
            key={z.value}
            type="button"
            title={z.label}
            onClick={() => onChange(value === z.value ? undefined : z.value)}
            style={{
              position: 'absolute',
              width: 18,
              height: 18,
              borderRadius: 5,
              border: '1px solid #ffffff55',
              background: value === z.value ? 'var(--accent)' : '#ffffff22',
              cursor: 'pointer',
              ...DOT_POSITION[z.value],
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, opacity: 0.55 }}>
        {value ? MOBILE_ZONES.find((z) => z.value === value)?.label : 'Sin zona — apilado normal'}
      </span>
    </div>
  )
}

function SortableButtonRow({
  button: b,
  index: i,
  total,
  mobileMode,
  onUpdate,
  onRemove,
  onMove,
}: {
  button: Button
  index: number
  total: number
  mobileMode: boolean
  onUpdate: (patch: Partial<Button>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: b.id })

  const textError = !b.text?.trim()
  const hrefError = !b.href?.trim() || !isSafeHref(b.href)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 10,
        borderRadius: 10,
        background: '#ffffff0f',
        border: '1px solid #ffffff1f',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: '#ffffff88',
            fontSize: 15,
            padding: '0 2px',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          ⠿
        </span>
        <span style={{ opacity: 0.5, fontSize: 12, minWidth: 54 }}>
          {i === 0 ? 'Primario' : i === 1 ? 'Secundario' : `Terciario`}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" style={iconBtn(i > 0)} onClick={() => onMove(-1)} title="Subir" disabled={i === 0}>
            ↑
          </button>
          <button
            type="button"
            style={iconBtn(i < total - 1)}
            onClick={() => onMove(1)}
            title="Bajar"
            disabled={i === total - 1}
          >
            ↓
          </button>
          <button
            type="button"
            style={{ ...iconBtn(true), borderColor: '#ff8a8a55', color: '#ff8a8a' }}
            onClick={onRemove}
            title="Eliminar"
          >
            ×
          </button>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ opacity: 0.7 }}>Texto</span>
        <input
          style={{ ...field, borderColor: textError ? '#ff8a8a' : '#ffffff3b' }}
          value={b.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ opacity: 0.7 }}>Tipo de destino</span>
        <select
          style={field}
          value={b.hrefType}
          onChange={(e) => onUpdate({ hrefType: e.target.value as HrefType })}
        >
          {(Object.keys(TYPE_LABELS) as HrefType[]).map((t) => (
            <option key={t} value={t} style={{ color: '#000' }}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ opacity: 0.7 }}>Destino</span>
        {b.hrefType === 'anchor' ? (
          <select
            style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
            value={PAGE_ANCHORS.some((a) => a.value === b.href) ? b.href : '__custom'}
            onChange={(e) => onUpdate({ href: e.target.value === '__custom' ? '' : e.target.value })}
          >
            {PAGE_ANCHORS.map((a) => (
              <option key={a.value} value={a.value} style={{ color: '#000' }}>
                {a.label} ({a.value})
              </option>
            ))}
            <option value="__custom" style={{ color: '#000' }}>
              Otra ancla…
            </option>
          </select>
        ) : (
          <input
            style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
            type={b.hrefType === 'url' ? 'url' : 'text'}
            inputMode={b.hrefType === 'whatsapp' || b.hrefType === 'phone' ? 'numeric' : undefined}
            placeholder={
              b.hrefType === 'url'
                ? 'https://…'
                : b.hrefType === 'whatsapp'
                  ? '593998381419 (país + número)'
                  : '593998381419'
            }
            value={b.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
          />
        )}
        {b.hrefType === 'anchor' && !PAGE_ANCHORS.some((a) => a.value === b.href) && (
          <input
            style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
            placeholder="#mi-seccion"
            value={b.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
          />
        )}
        {(b.hrefType === 'whatsapp' || b.hrefType === 'phone') && b.href.trim() && (
          <span style={{ opacity: 0.55, fontSize: 12 }}>→ {resolveButtonHref(b)}</span>
        )}
        {hrefError && <span style={{ color: '#ff8a8a', fontSize: 12 }}>Falta el destino o no está permitido.</span>}
      </label>

      {mobileMode && (
        <MobileZonePicker value={b.mobileZone} onChange={(zone) => onUpdate({ mobileZone: zone })} />
      )}
    </div>
  )
}
