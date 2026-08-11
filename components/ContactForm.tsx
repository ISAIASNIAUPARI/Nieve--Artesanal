'use client'

import { useState } from 'react'

export default function ContactForm({ confirmationMessage }: { confirmationMessage?: string }) {
  const [sent, setSent] = useState(false)

  return (
    <form
      id="contacto"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
      style={{
        background: '#ffffff10',
        border: '1px solid #ffffff22',
        borderRadius: 16,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-dm-serif), serif', fontSize: 22, color: '#fff' }}>Escríbenos</h3>
      <input
        type="text"
        placeholder="Nombre"
        required
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid #ffffff33',
          background: '#ffffff12',
          color: '#fff',
          fontSize: 15,
          fontFamily: 'inherit',
        }}
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        required
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid #ffffff33',
          background: '#ffffff12',
          color: '#fff',
          fontSize: 15,
          fontFamily: 'inherit',
        }}
      />
      <textarea
        placeholder="Mensaje"
        rows={4}
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid #ffffff33',
          background: '#ffffff12',
          color: '#fff',
          fontSize: 15,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />
      <button
        type="submit"
        style={{
          padding: 14,
          border: 'none',
          borderRadius: 999,
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Enviar mensaje
      </button>
      {sent && (
        <p style={{ margin: 0, color: 'var(--accent-light)', fontSize: 14 }}>
          {confirmationMessage || 'Gracias, te responderemos pronto.'}
        </p>
      )}
    </form>
  )
}
