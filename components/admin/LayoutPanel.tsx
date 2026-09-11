'use client'

import { useState } from 'react'
import type { LayoutSection } from '@/lib/types'
import { templateTypeOf } from '@/lib/types'
import { useEdit } from './EditProvider'
import NewSectionModal from './NewSectionModal'

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
  maxWidth: 480,
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
  background: '#1c1310',
  color: '#fff',
  borderRadius: 14,
  border: '1px solid #ffffff22',
  boxShadow: '0 30px 80px -20px #000',
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

/** Número de posición (1, 2, 3…) — gris, discreto, no compite con el nombre de la sección. */
const positionBadge: React.CSSProperties = {
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '1px solid #ffffff26',
  background: '#ffffff0f',
  color: '#ffffff88',
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/**
 * "Organizar página": reordenar, ocultar/mostrar, crear y eliminar secciones.
 * El orden/visibilidad se guarda con "Guardar" en la barra; crear y eliminar
 * commitean de inmediato (vía sus propias rutas API).
 */
export default function LayoutPanel({ onClose }: { onClose: () => void }) {
  const { layout, setLayoutSections, isDirty, unregisterDeletedSection } = useEdit()
  const sections = layout.sections
  const [newOpen, setNewOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function remove(section: LayoutSection) {
    if (!confirm(`¿Eliminar la sección «${section.label}»? No se puede deshacer.`)) return
    setDeleting(section.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/delete-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: section.id, label: section.label, layout: sections }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo eliminar.')
      unregisterDeletedSection(section.id, data.layout)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar.')
    } finally {
      setDeleting(null)
    }
  }

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
            position: 'sticky',
            top: 0,
            background: '#1c1310',
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
            Flechas para el orden · el ojo muestra u oculta · 🗑 elimina las secciones nuevas.
          </p>

          {error && <p style={{ margin: 0, fontSize: 12, color: '#ff8a8a' }}>⚠ {error}</p>}

          {sections.map((s, i) => {
            const isDynamic = !!templateTypeOf(s.id)
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: s.visible ? '#ffffff10' : '#ffffff06',
                  border: '1px solid #ffffff1a',
                  opacity: deleting === s.id ? 0.4 : s.visible ? 1 : 0.55,
                }}
              >
                <span style={positionBadge} title={`Posición ${i + 1}`}>{i + 1}</span>

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

                <span style={{ flex: 1, fontSize: 14 }}>
                  {s.label}
                  {isDynamic && <span style={{ opacity: 0.4, fontSize: 11 }}> · nueva</span>}
                </span>

                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  title={s.visible ? 'Ocultar' : 'Mostrar'}
                  style={{
                    border: '1px solid #ffffff3b',
                    background: '#ffffff12',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '5px 9px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {s.visible ? '👁' : '🚫'}
                </button>

                {isDynamic && (
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    disabled={deleting !== null || isDirty}
                    title={isDirty ? 'Guarda tus cambios primero' : 'Eliminar sección'}
                    style={{
                      border: '1px solid #e0808055',
                      background: '#ffffff10',
                      color: '#ff9a9a',
                      borderRadius: 8,
                      padding: '5px 9px',
                      cursor: deleting !== null || isDirty ? 'default' : 'pointer',
                      fontSize: 12,
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            )
          })}

          {heroHidden && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f5c25a' }}>
              ⚠ La portada está oculta. La página empezará por la siguiente sección visible.
            </p>
          )}

          <button
            type="button"
            onClick={() => setNewOpen(true)}
            disabled={isDirty}
            title={isDirty ? 'Guarda tus cambios primero' : undefined}
            style={{
              marginTop: 8,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px dashed #ffffff55',
              background: 'transparent',
              color: isDirty ? '#ffffff55' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isDirty ? 'default' : 'pointer',
            }}
          >
            + Nueva sección
          </button>
          {isDirty && (
            <p style={{ margin: 0, fontSize: 11, opacity: 0.55 }}>
              Guarda los cambios pendientes antes de crear o eliminar una sección.
            </p>
          )}
        </div>
      </div>

      {newOpen && <NewSectionModal onClose={() => setNewOpen(false)} />}
    </div>
  )
}
