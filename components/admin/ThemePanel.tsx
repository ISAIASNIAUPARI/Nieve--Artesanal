'use client'

import { useRef, useState } from 'react'
import type { Theme } from '@/lib/types'

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
  maxWidth: 420,
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
  background: '#1c1310',
  color: '#fff',
  borderRadius: 14,
  border: '1px solid #ffffff22',
  boxShadow: '0 30px 80px -20px #000',
}

const ROWS: { key: keyof Theme; cssVar: string; label: string }[] = [
  { key: 'colorPrimary', cssVar: '--color-primary', label: 'Color principal' },
  { key: 'colorSecondary', cssVar: '--color-secondary', label: 'Color secundario' },
  { key: 'colorAccent', cssVar: '--color-accent', label: 'Color de acento' },
]

/**
 * "Personalizar tema": 3 selectores de color que controlan toda la paleta de
 * marca del sitio (naranja/crema/café → --color-primary/secondary/accent en
 * <html>, de ahí a --accent/--bg/--ink en globals.css, de ahí a todo el sitio).
 *
 * El preview es instantáneo: cada picker escribe directo en
 * document.documentElement con setProperty, así el cliente ve el resultado
 * ANTES de guardar. Si cierra el panel sin guardar, esos cambios de preview
 * se revierten al último tema realmente guardado — para que no se quede el
 * sitio "viéndose distinto" sin que el cambio esté guardado de verdad.
 */
export default function ThemePanel({ initialTheme, onClose }: { initialTheme: Theme; onClose: () => void }) {
  const [colors, setColors] = useState<Theme>(initialTheme)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const lastSavedRef = useRef<Theme>(initialTheme)

  const applyPreview = (next: Theme) => {
    for (const row of ROWS) {
      document.documentElement.style.setProperty(row.cssVar, next[row.key])
    }
  }

  const handlePick = (key: keyof Theme, value: string) => {
    const next = { ...colors, [key]: value }
    setColors(next)
    setSaved(false)
    applyPreview(next)
  }

  const handleClose = () => {
    if (!saved) applyPreview(lastSavedRef.current)
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/save-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al guardar el tema.')
      lastSavedRef.current = colors
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el tema.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={handleClose}>
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
          <strong style={{ fontSize: 15 }}>🎨 Paleta de colores</strong>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
            Estos 3 colores controlan toda la paleta de marca del sitio. El cambio se ve al instante aquí mismo; para que
            quede así de verdad para todos, hay que guardarlo.
          </p>

          {error && <p style={{ margin: 0, fontSize: 12, color: '#ff8a8a' }}>⚠ {error}</p>}
          {saved && !error && <p style={{ margin: 0, fontSize: 12, color: '#8fd694' }}>✅ Tema guardado en GitHub — Vercel está desplegando (~1 min)</p>}

          {ROWS.map((row) => (
            <label key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14 }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.6, fontFamily: 'monospace' }}>{colors[row.key]}</span>
                <input
                  type="color"
                  value={colors[row.key]}
                  onChange={(e) => handlePick(row.key, e.target.value)}
                  style={{ width: 40, height: 32, padding: 0, border: '1px solid #ffffff3b', borderRadius: 6, background: 'none', cursor: 'pointer' }}
                />
              </div>
            </label>
          ))}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 4,
              padding: 12,
              border: 'none',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'default' : 'pointer',
              background: saving ? '#5a5048' : '#d7742f',
              color: '#fff',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar tema'}
          </button>
        </div>
      </div>
    </div>
  )
}
