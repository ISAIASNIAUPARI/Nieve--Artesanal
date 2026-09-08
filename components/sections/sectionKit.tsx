'use client'

import EditableText from '../editable/EditableText'

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
  return <section id={id} style={{ padding: '100px 6vw', ...style }}>{children}</section>
}

/** Encabezado centrado (antetítulo opcional + título editable). */
export function SectionHeading({
  heading,
  edit,
  onChange,
  eyebrow,
}: {
  heading?: string
  edit?: boolean
  onChange?: (value: string) => void
  eyebrow?: string
}) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
      {eyebrow && (
        <div
          style={{
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
      )}
      <EditableText
        as="h2"
        edit={edit}
        value={heading}
        onChange={onChange}
        placeholder="Título de la sección"
        style={{
          fontFamily: 'var(--font-dm-serif), serif',
          fontSize: 'clamp(28px,3.5vw,42px)',
          color: 'var(--ink)',
          margin: 0,
        }}
      />
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
