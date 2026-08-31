'use client'

import type { AboutSectionData } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'

interface AboutProps {
  data?: AboutSectionData
  edit?: boolean
  onChange?: (field: keyof AboutSectionData, value: string) => void
  onImageChange?: (field: keyof AboutSectionData, file: File) => void
}

export default function About({ data, edit, onChange, onImageChange }: AboutProps) {
  if (!data) return null

  return (
    <section
      id="nosotros"
      style={{
        padding: '100px 6vw',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
        alignItems: 'center',
      }}
    >
      <div>
        <EditableText
          edit={edit}
          value={data.eyebrow}
          onChange={(v) => onChange?.('eyebrow', v)}
          placeholder="Antetítulo"
          style={{ display: 'inline-block', color: 'var(--accent)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}
        />
        <EditableText
          as="h2"
          edit={edit}
          value={data.heading}
          onChange={(v) => onChange?.('heading', v)}
          placeholder="Título de la sección"
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(28px,3.5vw,42px)',
            margin: '12px 0 20px',
            color: 'var(--ink)',
          }}
        />
        <EditableText
          as="p"
          edit={edit}
          value={data.paragraph1}
          onChange={(v) => onChange?.('paragraph1', v)}
          placeholder="Primer párrafo"
          style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: '0 0 18px' }}
        />
        <EditableText
          as="p"
          edit={edit}
          value={data.paragraph2}
          onChange={(v) => onChange?.('paragraph2', v)}
          placeholder="Segundo párrafo"
          style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0 }}
        />
      </div>
      <EditableImage
        src={data.image?.src}
        alt={data.image?.alt}
        edit={edit}
        onFile={(file) => onImageChange?.('image', file)}
        wrapperStyle={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3' }}
      />
    </section>
  )
}
