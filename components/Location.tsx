'use client'

import type { LocationSectionData } from '@/lib/types'
import EditableText from './editable/EditableText'
import ContactForm from './ContactForm'

interface LocationProps {
  data?: LocationSectionData
  edit?: boolean
  onChange?: (field: keyof LocationSectionData, value: string) => void
}

export default function Location({ data, edit, onChange }: LocationProps) {
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
        <EditableText
          edit={edit}
          value={data.eyebrow}
          onChange={(v) => onChange?.('eyebrow', v)}
          placeholder="Antetítulo"
          style={{ display: 'inline-block', color: 'var(--accent-light)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}
        />
        <EditableText
          as="h2"
          edit={edit}
          value={data.heading}
          onChange={(v) => onChange?.('heading', v)}
          placeholder="Título de la sección"
          style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 'clamp(28px,3.5vw,42px)', margin: '12px 0 28px', color: '#fff' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 16, lineHeight: 1.6, color: '#e8e2d8' }}>
          <div>
            <strong style={{ color: '#fff' }}>Dirección</strong>
            <br />
            <EditableText edit={edit} value={data.address} onChange={(v) => onChange?.('address', v)} placeholder="Dirección" />
          </div>
          <div>
            <strong style={{ color: '#fff' }}>Horario</strong>
            <br />
            <EditableText edit={edit} value={data.schedule} onChange={(v) => onChange?.('schedule', v)} placeholder="Horario" />
          </div>
          <div>
            <strong style={{ color: '#fff' }}>Teléfono</strong>
            <br />
            <EditableText edit={edit} value={data.phone} onChange={(v) => onChange?.('phone', v)} placeholder="Teléfono" />
          </div>
        </div>
      </div>
      <ContactForm confirmationMessage={data.confirmationMessage} />
    </section>
  )
}
