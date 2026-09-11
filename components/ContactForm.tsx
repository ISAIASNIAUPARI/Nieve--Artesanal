'use client'

interface ContactFormProps {
  /** Número de WhatsApp del negocio (Location.tsx pasa data.phone) — a donde se abre el chat al enviar. */
  whatsappNumber?: string
}

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#ffffff99',
}

const input: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid #ffffff33',
  background: '#ffffff12',
  color: '#fff',
  fontSize: 15,
  fontFamily: 'inherit',
}

/**
 * Formulario de contacto: al enviar arma un mensaje con los datos escritos y
 * abre WhatsApp con el número del negocio — no hay backend de correo (sitio
 * de demostración), WhatsApp es el canal real que el cliente usa para
 * atender pedidos.
 */
export default function ContactForm({ whatsappNumber }: ContactFormProps) {
  return (
    <form
      id="contacto"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const name = (form.elements.namedItem('name') as HTMLInputElement).value
        const email = (form.elements.namedItem('email') as HTMLInputElement).value
        const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
        const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value
        const digits = (whatsappNumber || '').replace(/[^\d]/g, '')
        if (!digits) return
        const text = [`¡Hola! Soy ${name}.`, `Correo: ${email}`, phone && `Teléfono: ${phone}`, '', message].filter(Boolean).join('\n')
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank')
      }}
      style={{
        background: '#ffffff10',
        border: '1px solid #ffffff22',
        borderRadius: 16,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-dm-serif), serif', fontSize: 22, color: '#fff' }}>Escríbenos</h3>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={label}>Nombre completo</span>
        <input name="name" type="text" placeholder="Juan Pérez…" required style={input} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={label}>Correo electrónico</span>
        <input name="email" type="email" placeholder="juan@email.com…" required style={input} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={label}>Teléfono</span>
        <input name="phone" type="tel" placeholder="+593 99 999 0000…" style={input} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={label}>Mensaje</span>
        <textarea name="message" placeholder="Escríbenos tu consulta…" rows={4} style={{ ...input, resize: 'vertical' }} />
      </label>

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
      <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#ffffff88' }}>
        Al enviar se abrirá WhatsApp para completar tu mensaje.
      </p>
    </form>
  )
}
