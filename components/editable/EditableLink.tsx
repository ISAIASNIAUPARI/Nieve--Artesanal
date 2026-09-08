'use client'

import { useState } from 'react'
import { isSafeHref } from '@/lib/types'

/**
 * Campo para editar el destino (href) de un botón desde el /admin.
 * Rechaza esquemas peligrosos (javascript:, data:, vbscript:) — no propaga el
 * valor al contenido hasta que es válido, y muestra el error en rojo.
 */
export default function EditableLink({
  value,
  onChange,
  label,
}: {
  value?: string
  onChange?: (value: string) => void
  label: string
}) {
  const [draft, setDraft] = useState(value ?? '')
  const invalid = !isSafeHref(draft)

  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 8,
        fontSize: 12,
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      <input
        type="text"
        value={draft}
        placeholder="/sabores  ·  #ubicacion  ·  https://…"
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          if (isSafeHref(next)) onChange?.(next.trim())
        }}
        style={{
          padding: '7px 10px',
          borderRadius: 8,
          border: `1px solid ${invalid ? '#ff8a8a' : '#ffffff44'}`,
          background: '#00000055',
          color: '#fff',
          fontSize: 13,
          fontFamily: 'inherit',
          minWidth: 220,
        }}
      />
      {invalid && <span style={{ color: '#ff8a8a' }}>Ese enlace no está permitido (javascript:, data:…).</span>}
    </label>
  )
}
