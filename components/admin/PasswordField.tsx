'use client'

import { useState } from 'react'

/** Campo de contraseña con casilla "Mostrar contraseña" para alternar entre
 * ocultar y ver lo que se está escribiendo. */
export default function PasswordField() {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type={visible ? 'text' : 'password'}
        name="password"
        placeholder="Contraseña"
        required
        autoFocus
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          fontSize: 15,
          fontFamily: 'inherit',
        }}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        Mostrar contraseña
      </label>
    </div>
  )
}
