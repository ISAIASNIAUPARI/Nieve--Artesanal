'use client'

import type { Button, HrefType } from '@/lib/types'
import { MAX_BUTTONS, isSafeHref, newButton, resolveButtonHref } from '@/lib/types'
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

// Este panel solo se muestra en desktop (en móvil solo se arrastra la posición
// en la vista previa — ver SectionButtons.tsx), así que ya no necesita una
// variante "mobileMode": un solo juego de tamaños, chico a propósito — el
// cliente lo pidió "dos veces más pequeño" que la versión anterior.
// width:'fit-content' para que el panel no se estire al ancho disponible del
// contenedor — se ajusta a su contenido (la línea más larga que tenga
// adentro), con maxWidth como tope para cuando hay varios botones con textos
// largos. El cliente pidió que dejara de verse "ancho con espacio vacío".
const box: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 10,
  color: '#fff',
  background: '#0000008c',
  border: '1px solid #ffffff2b',
  borderRadius: 8,
  padding: 5,
  margin: '18px 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  width: 'fit-content',
  maxWidth: 190,
  textAlign: 'left',
}

const field: React.CSSProperties = {
  padding: '3px 5px',
  borderRadius: 5,
  border: '1px solid #ffffff3b',
  background: '#00000066',
  color: '#fff',
  fontSize: 10,
  fontFamily: 'inherit',
  width: '100%',
}

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  border: '1px solid #ffffff3b',
  background: enabled ? '#ffffff17' : '#ffffff08',
  color: enabled ? '#fff' : '#ffffff55',
  borderRadius: 5,
  width: 18,
  height: 18,
  cursor: enabled ? 'pointer' : 'default',
  fontSize: 10,
  lineHeight: 1,
})

/**
 * Editor de la barra de botones de una sección (0 a 5 botones). Solo se
 * renderiza en desktop — ver los 6 componentes que lo llaman (Hero, About,
 * Flavors, VideoSection, Location, CtaBanner): el `<ButtonsEditor>` vive
 * FUERA del `<section>`, no adentro. Si viviera adentro, el panel (que crece
 * cada vez que se agrega un botón) inflaría el alto de la sección, y como el
 * canvas de posición libre de SectionButtons mide sus % contra ESE alto, los
 * botones ya colocados se "correrían" cada vez que el panel cambia de tamaño
 * — eso rompía la vista previa (ver Fase D, Parte 8 en Obsidian).
 *
 * Es "controlado": recibe `buttons` y llama `onChange` con el array nuevo
 * (añadir, borrar, reordenar, editar). El commit al JSON lo hace "Guardar".
 *
 * El reorden (que decide cuál es Primario/Secundario/Terciario, para el
 * estilo) tiene dos caminos, ambos terminan en el mismo `onChange(next)`: las
 * flechas ↑↓ de siempre, y arrastrar la tarjeta desde su asa (⠿). La posición
 * VISUAL del botón (dónde aparece en la página) es otra cosa aparte — se
 * arrastra directo en la vista previa (SectionButtons.tsx), no aquí.
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
  const { layout } = useEdit()
  // Nº. Nombre, en el orden real que tiene ahora mismo "Organizar página" — no una
  // lista fija: si el cliente reordena o renombra una sección ahí, el dropdown de
  // Destino lo refleja solo. "Contacto" no es una sección de layout.sections (es el
  // ancla fija del formulario dentro de Ubicación), así que se agrega aparte al final.
  const anchorOptions = [
    ...layout.sections.map((s, i) => ({ value: `#${s.id}`, label: `${i + 1}. ${s.label}` })),
    { value: '#contacto', label: 'Contacto' },
  ]
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
      <strong style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Botones de «{sectionLabel}» ({buttons.length}/{max})
      </strong>
      <span style={{ fontSize: 9, opacity: 0.55 }}>
        Arrastra un botón en la vista previa de arriba para moverlo libremente.
      </span>

      {buttons.length === 0 && <span style={{ opacity: 0.6 }}>Esta sección no tiene botones.</span>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={buttons.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {buttons.map((b, i) => (
            <SortableButtonRow
              key={b.id}
              button={b}
              index={i}
              total={buttons.length}
              anchorOptions={anchorOptions}
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
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px dashed #ffffff55',
          background: 'transparent',
          color: buttons.length >= max ? '#ffffff55' : '#fff',
          fontSize: 10,
          fontWeight: 600,
          cursor: buttons.length >= max ? 'default' : 'pointer',
        }}
      >
        + Añadir botón
      </button>
    </div>
  )
}

function SortableButtonRow({
  button: b,
  index: i,
  total,
  anchorOptions,
  onUpdate,
  onRemove,
  onMove,
}: {
  button: Button
  index: number
  total: number
  anchorOptions: { value: string; label: string }[]
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
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: 4,
        borderRadius: 6,
        background: '#ffffff0f',
        border: '1px solid #ffffff1f',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: '#ffffff88',
            fontSize: 10,
            padding: '0 2px',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          ⠿
        </span>
        <span style={{ opacity: 0.5, fontSize: 9, minWidth: 38 }}>
          {i === 0 ? 'Primario' : i === 1 ? 'Secundario' : `Terciario`}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
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

      <label style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ opacity: 0.7, fontSize: 10 }}>Texto</span>
        <input
          style={{ ...field, borderColor: textError ? '#ff8a8a' : '#ffffff3b' }}
          value={b.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ opacity: 0.7, fontSize: 10 }}>Tipo de destino</span>
        {/* href se limpia al cambiar el tipo — sin esto, un botón nuevo (que
            arranca con href="#hero") al pasarlo a URL/WhatsApp/Teléfono se
            quedaba con "#hero" metido en el campo Destino, dando la
            impresión de que no había dónde escribir el link real. */}
        <select
          style={field}
          value={b.hrefType}
          onChange={(e) => onUpdate({ hrefType: e.target.value as HrefType, href: '', whatsappMessage: undefined })}
        >
          {(Object.keys(TYPE_LABELS) as HrefType[]).map((t) => (
            <option key={t} value={t} style={{ color: '#000' }}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ opacity: 0.7, fontSize: 10 }}>Destino</span>
        {b.hrefType === 'anchor' ? (
          <select
            style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
            value={anchorOptions.some((a) => a.value === b.href) ? b.href : '__custom'}
            onChange={(e) => onUpdate({ href: e.target.value === '__custom' ? '' : e.target.value })}
          >
            {anchorOptions.map((a) => (
              <option key={a.value} value={a.value} style={{ color: '#000' }}>
                {a.label}
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
        {b.hrefType === 'anchor' && !anchorOptions.some((a) => a.value === b.href) && (
          <input
            style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
            placeholder="#mi-seccion"
            value={b.href}
            onChange={(e) => onUpdate({ href: e.target.value })}
          />
        )}
        {(b.hrefType === 'whatsapp' || b.hrefType === 'phone') && b.href.trim() && (
          <span style={{ opacity: 0.55, fontSize: 9 }}>→ {resolveButtonHref(b)}</span>
        )}
        {hrefError && <span style={{ color: '#ff8a8a', fontSize: 9 }}>Falta el destino o no está permitido.</span>}
      </label>

      {b.hrefType === 'whatsapp' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ opacity: 0.7, fontSize: 10 }}>Mensaje predeterminado (opcional)</span>
          <input
            style={field}
            placeholder="Hola, quiero hacer un pedido…"
            value={b.whatsappMessage ?? ''}
            onChange={(e) => onUpdate({ whatsappMessage: e.target.value })}
          />
        </label>
      )}
    </div>
  )
}
