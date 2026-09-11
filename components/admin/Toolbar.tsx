'use client'

import { useState } from 'react'
import { useEdit } from './EditProvider'
import LayoutPanel from './LayoutPanel'

const viewModeBtn = (active: boolean): React.CSSProperties => ({
  border: '1px solid #ffffff3b',
  background: active ? '#ffffff28' : 'transparent',
  color: '#fff',
  padding: '6px 10px',
  fontSize: 15,
  lineHeight: 1,
  cursor: 'pointer',
})

export default function Toolbar() {
  const { isDirty, saving, saveError, lastSaved, save, uploads, viewMode, setViewMode } = useEdit()
  const busyUploading = Object.values(uploads).some((u) => !u.error)
  const [layoutOpen, setLayoutOpen] = useState(false)

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 20px',
        background: '#1c1310',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        boxShadow: '0 2px 12px #00000040',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700 }}>✏️ Editor · Nieve Artesanal</span>
        <button
          type="button"
          onClick={() => setLayoutOpen(true)}
          disabled={viewMode === 'mobile'}
          title={viewMode === 'mobile' ? 'El orden de las secciones se organiza desde la vista desktop' : undefined}
          style={{
            border: '1px solid #ffffff3b',
            background: viewMode === 'mobile' ? '#ffffff08' : '#ffffff12',
            color: viewMode === 'mobile' ? '#ffffff55' : '#fff',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: viewMode === 'mobile' ? 'default' : 'pointer',
          }}
        >
          ☰ Organizar página
        </button>
      </div>

      {layoutOpen && <LayoutPanel onClose={() => setLayoutOpen(false)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {saveError && <span style={{ color: '#ff8a8a' }}>⚠ {saveError}</span>}
        {!saveError && lastSaved && !isDirty && (
          <a href={lastSaved.htmlUrl} target="_blank" rel="noreferrer" style={{ color: '#8fd694' }}>
            ✅ Guardado en GitHub — Vercel está desplegando (~1 min)
          </a>
        )}
        {busyUploading && <span style={{ color: '#7db8ff' }}>Subiendo un archivo…</span>}
        {!busyUploading && !saveError && isDirty && !saving && <span style={{ color: '#f5c25a' }}>Cambios sin guardar</span>}
        {saving && <span style={{ opacity: 0.8 }}>Guardando…</span>}

        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            title="Vista desktop"
            style={viewModeBtn(viewMode === 'desktop')}
          >
            🖥️
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            title="Vista móvil"
            style={{ ...viewModeBtn(viewMode === 'mobile'), borderLeft: 'none' }}
          >
            📱
          </button>
        </div>

        <a href="/" target="_blank" rel="noreferrer" style={{ color: '#fff', opacity: 0.75, textDecoration: 'underline' }}>
          Ver sitio público
        </a>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', fontSize: 13 }}
          >
            Salir
          </button>
        </form>
        <button
          onClick={save}
          disabled={!isDirty || saving || busyUploading}
          style={{
            padding: '9px 20px',
            borderRadius: 999,
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            cursor: isDirty && !saving && !busyUploading ? 'pointer' : 'default',
            background: isDirty && !saving && !busyUploading ? '#d7742f' : '#5a5048',
            color: '#fff',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
