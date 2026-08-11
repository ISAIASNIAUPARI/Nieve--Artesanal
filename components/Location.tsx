import type { LocationSectionData } from '@/sanity/lib/types'
import ContactForm from './ContactForm'

export default function Location({ data }: { data?: LocationSectionData }) {
  if (!data) return null

  return (
    <section
      id="ubicacion"
      style={{
        padding: '100px 6vw',
        background: 'var(--ink)',
        color: '#fff',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
      }}
    >
      <div>
        {data.eyebrow && (
          <span style={{ color: 'var(--accent-light)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {data.eyebrow}
          </span>
        )}
        <h2 style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 'clamp(28px,3.5vw,42px)', margin: '12px 0 28px', color: '#fff' }}>
          {data.heading}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 16, lineHeight: 1.6, color: '#e8e2d8' }}>
          {data.address && (
            <div>
              <strong style={{ color: '#fff' }}>Dirección</strong>
              <br />
              {data.address}
            </div>
          )}
          {data.schedule && (
            <div>
              <strong style={{ color: '#fff' }}>Horario</strong>
              <br />
              {data.schedule}
            </div>
          )}
          {data.phone && (
            <div>
              <strong style={{ color: '#fff' }}>Teléfono</strong>
              <br />
              {data.phone}
            </div>
          )}
        </div>
      </div>
      <ContactForm confirmationMessage={data.confirmationMessage} />
    </section>
  )
}
