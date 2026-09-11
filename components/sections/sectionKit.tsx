'use client'

import EditableText from '../editable/EditableText'
import { useIsMobileView } from '../useIsMobileView'

/** Cáscara de sección: mismo padding y ancho que el resto del sitio. */
export function SectionShell({
  id,
  children,
  style,
}: {
  id: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const isMobile = useIsMobileView()
  return (
    <section id={id} style={{ padding: isMobile ? '48px 20px' : '100px 6vw', ...style }}>
      {children}
    </section>
  )
}

/**
 * Encabezado centrado: subtítulo pequeño editable (opcional) + título editable.
 * El subtítulo se muestra siempre en edición (con el contorno azul fijo, para que
 * se note que ahí se puede escribir aunque esté vacío); en el sitio público solo
 * aparece si tiene texto de verdad — "" o solo espacios no dejan hueco en blanco.
 */
export function SectionHeading({
  heading,
  edit,
  onChange,
  subtitle,
  onSubtitleChange,
}: {
  heading?: string
  edit?: boolean
  onChange?: (value: string) => void
  subtitle?: string
  onSubtitleChange?: (value: string) => void
}) {
  const isMobile = useIsMobileView()
  const showSubtitle = edit || Boolean(subtitle && subtitle.trim() !== '')
  return (
    <div style={{ textAlign: 'center', maxWidth: 640, margin: isMobile ? '0 auto 28px' : '0 auto 48px' }}>
      {/*
        Cada campo va en su propio contenedor de ancho completo. EditableText, en modo
        edición, cae a `display:inline-block` cuando su `style` no fija uno propio (lo
        necesita para que el contorno no se estire de borde a borde) — eso es justo lo
        que hacía que, en el admin, el subtitle y el heading pudieran quedar uno junto al
        otro cuando el subtitle era corto: dos elementos inline-block seguidos, con hueco
        de sobra, se acomodan en la misma línea. En el sitio público no pasa porque ahí el
        heading es un <h2> normal (de bloque) al no tener ese `edit` forzando su display.
        Envolver cada campo en su propio `div` de bloque garantiza el apilado en los dos
        modos, sin tocar el estilo del <h2> ni del <span> que ya renderiza el sitio en vivo.
      */}
      {showSubtitle && (
        <div style={{ display: 'block', width: '100%' }}>
          <EditableText
            edit={edit}
            value={subtitle}
            onChange={onSubtitleChange}
            placeholder="Etiqueta superior (opcional)"
            alwaysShowOutline
            style={{
              display: 'inline-block',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          />
        </div>
      )}
      <div style={{ display: 'block', width: '100%' }}>
        <EditableText
          as="h2"
          edit={edit}
          value={heading}
          onChange={onChange}
          placeholder="Título de la sección"
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: isMobile ? 26 : 'clamp(28px,3.5vw,42px)',
            lineHeight: 1.2,
            color: 'var(--ink)',
            margin: 0,
          }}
        />
      </div>
    </div>
  )
}

const ctrlBtn = (enabled: boolean): React.CSSProperties => ({
  border: '1px solid var(--line)',
  background: enabled ? '#fff' : '#f3f0ec',
  color: enabled ? 'var(--ink)' : '#bbb',
  borderRadius: 8,
  width: 28,
  height: 28,
  cursor: enabled ? 'pointer' : 'default',
  fontSize: 13,
  lineHeight: 1,
})

/** Botones ↑ ↓ × para un elemento de una lista editable. */
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
  label = 'este elemento',
}: {
  index: number
  count: number
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  label?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <button type="button" style={ctrlBtn(index > 0)} disabled={index === 0} onClick={() => onMove(-1)} title="Subir">
        ↑
      </button>
      <button
        type="button"
        style={ctrlBtn(index < count - 1)}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        title="Bajar"
      >
        ↓
      </button>
      <button
        type="button"
        style={{ ...ctrlBtn(true), borderColor: '#e0a0a0', color: '#c0392b' }}
        onClick={() => {
          if (confirm(`¿Eliminar ${label}?`)) onRemove()
        }}
        title="Eliminar"
      >
        ×
      </button>
    </div>
  )
}

/** Botón "+ Añadir…" en estilo discreto. */
export function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        alignSelf: 'center',
        padding: '10px 18px',
        borderRadius: 999,
        border: '1px dashed var(--accent)',
        background: 'transparent',
        color: 'var(--accent)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/** Utilidad: mueve el elemento `index` de `list` en la dirección `dir`. */
export function moved<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
