'use client'

import { useEdit } from './EditProvider'

export default function Toolbar() {
  const { isDirty, saving, saveError, lastSaved, save } = useEdit()

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
        <span style={{ opacity: 0.6 }}>Clic en cualquier texto o imagen para editarlo</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {saveError && <span style={{ color: '#ff8a8a' }}>⚠ {saveError}</span>}
        {!saveError && lastSaved && !isDirty && (
          <a href={lastSaved.htmlUrl} target="_blank" rel="noreferrer" style={{ color: '#8fd694' }}>
            ✅ Guardado en GitHub — Vercel está desplegando (~1 min)
          </a>
        )}
        {!saveError && isDirty && !saving && <span style={{ color: '#f5c25a' }}>Cambios sin guardar</span>}
        {saving && <span style={{ opacity: 0.8 }}>Guardando…</span>}

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
          disabled={!isDirty || saving}
          style={{
            padding: '9px 20px',
            borderRadius: 999,
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            cursor: isDirty && !saving ? 'pointer' : 'default',
            background: isDirty && !saving ? '#d7742f' : '#5a5048',
            color: '#fff',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
