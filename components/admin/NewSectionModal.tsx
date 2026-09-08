'use client'

import { useState } from 'react'
import { SECTION_TEMPLATES, slugify, type SectionTemplateType } from '@/lib/types'
import { useEdit } from './EditProvider'

export default function NewSectionModal({ onClose }: { onClose: () => void }) {
  const { layout, registerCreatedSection } = useEdit()
  const [type, setType] = useState<SectionTemplateType | null>(null)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewId = type && slugify(label) ? `${type}-${slugify(label)}` : ''

  async function create() {
    if (!type || !label.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/create-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, label: label.trim(), layout: layout.sections }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo crear la sección.')
      registerCreatedSection(data.id, data.content, data.layout)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear la sección.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: '#000000aa',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '70px 16px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          background: '#1c1310',
          color: '#fff',
          borderRadius: 14,
          border: '1px solid #ffffff22',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 15 }}>Nueva sección</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 12, opacity: 0.6 }}>1. Elige una plantilla:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SECTION_TEMPLATES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(t.type)}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${type === t.type ? 'var(--accent, #d7742f)' : '#ffffff26'}`,
                background: type === t.type ? '#d7742f22' : '#ffffff0d',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span>
                <span style={{ fontWeight: 600, fontSize: 14, display: 'block' }}>{t.label}</span>
                <span style={{ fontSize: 12, opacity: 0.6 }}>{t.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {type && (
          <>
            <p style={{ margin: '16px 0 6px', fontSize: 12, opacity: 0.6 }}>2. Ponle un nombre:</p>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Promo de verano"
              onKeyDown={(e) => e.key === 'Enter' && create()}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #ffffff3b',
                background: '#00000055',
                color: '#fff',
                fontSize: 14,
              }}
            />
            {previewId && <p style={{ margin: '6px 0 0', fontSize: 11, opacity: 0.45 }}>id: {previewId}</p>}
          </>
        )}

        {error && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#ff8a8a' }}>⚠ {error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={create}
            disabled={!type || !label.trim() || busy}
            style={{
              padding: '9px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: !type || !label.trim() || busy ? 'default' : 'pointer',
              background: !type || !label.trim() || busy ? '#5a5048' : '#d7742f',
              color: '#fff',
            }}
          >
            {busy ? 'Creando…' : 'Crear sección'}
          </button>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 11, opacity: 0.5 }}>
          Al crear la sección se hace un commit y Vercel redespliega (~1 min). Ya puedes editar su
          contenido aquí mismo; se guardará con «Guardar cambios».
        </p>
      </div>
    </div>
  )
}
