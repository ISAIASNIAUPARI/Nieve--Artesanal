'use client'

import type { LayoutSection } from '@/lib/types'
import { useEdit } from './EditProvider'

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1100,
  background: '#00000088',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '80px 16px 16px',
  fontFamily: 'system-ui, sans-serif',
}

const panel: React.CSSProperties = {
  width: '100%',
  maxWidth: 460,
  background: '#1c1310',
  color: '#fff',
  borderRadius: 14,
  border: '1px solid #ffffff22',
  boxShadow: '0 30px 80px -20px #000',
  overflow: 'hidden',
}

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  border: '1px solid #ffffff3b',
  background: enabled ? '#ffffff17' : '#ffffff08',
  color: enabled ? '#fff' : '#ffffff44',
  borderRadius: 8,
  width: 30,
  height: 30,
  cursor: enabled ? 'pointer' : 'default',
  fontSize: 14,
  lineHeight: 1,
})

/**
 * "Organizar página": reordenar y ocultar/mostrar las secciones.
 * Escribe el resultado en content/pageLayout.json al pulsar "Guardar" en la barra.
 */
export default function LayoutPanel({ onClose }: { onClose: () => void }) {
  const { layout, setLayoutSections } = useEdit()
  const sections = layout.sections

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    setLayoutSections(next)
  }

  const toggle = (id: string) =>
    setLayoutSections(sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)))

  const heroHidden = sections.some((s: LayoutSection) => s.id === 'hero' && !s.visible)

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #ffffff1f',
          }}
        >
          <strong style={{ fontSize: 15 }}>Organizar página</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, opacity: 0.6 }}>
            Usa las flechas para cambiar el orden. El ojo muestra u oculta la sección.
          </p>

          {sections.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: s.visible ? '#ffffff10' : '#ffffff06',
                border: '1px solid #ffffff1a',
                opacity: s.visible ? 1 : 0.55,
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" style={iconBtn(i > 0)} onClick={() => move(i, -1)} disabled={i === 0} title="Subir">
                  ↑
                </button>
                <button
                  type="button"
                  style={iconBtn(i < sections.length - 1)}
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  title="Bajar"
                >
                  ↓
                </button>
              </div>

              <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>

              <button
                type="button"
                onClick={() => toggle(s.id)}
                title={s.visible ? 'Ocultar' : 'Mostrar'}
                style={{
                  border: '1px solid #ffffff3b',
                  background: '#ffffff12',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {s.visible ? '👁 Visible' : '🚫 Oculta'}
              </button>
            </div>
          ))}

          {heroHidden && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f5c25a' }}>
              ⚠ La portada está oculta. La página empezará directamente por la siguiente sección visible.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
