'use client'

import type { AboutSectionData, Button, MediaUploadStatus } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'
import SectionButtons from './sections/SectionButtons'
import ButtonsEditor from './admin/ButtonsEditor'
import { useIsMobileView } from './useIsMobileView'

interface AboutProps {
  data?: AboutSectionData
  edit?: boolean
  onChange?: (field: keyof AboutSectionData, value: string) => void
  onButtonsChange?: (buttons: Button[]) => void
  onImageChange?: (field: keyof AboutSectionData, file: File) => void
  onFocalChange?: (field: keyof AboutSectionData, x: number, y: number) => void
  uploads?: Record<string, MediaUploadStatus>
}

export default function About({ data, edit, onChange, onButtonsChange, onImageChange, onFocalChange, uploads }: AboutProps) {
  const isMobile = useIsMobileView()
  if (!data) return null

  return (
    <>
    <section
      id="about"
      style={{
        position: 'relative',
        padding: isMobile ? '48px 20px' : '100px 6vw',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 32 : 64,
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
            fontSize: isMobile ? 26 : 'clamp(28px,3.5vw,42px)',
            lineHeight: 1.2,
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
        <SectionButtons buttons={data.buttons} tone="light" edit={edit} onReorder={onButtonsChange} style={{ marginTop: 28 }} />
      </div>
      <EditableImage
        src={data.image?.src}
        alt={data.image?.alt}
        edit={edit}
        onFile={(file) => onImageChange?.('image', file)}
        upload={uploads?.image}
        focalX={data.image?.focalX}
        focalY={data.image?.focalY}
        aspectRatio={4 / 3}
        onFocalChange={(x, y) => onFocalChange?.('image', x, y)}
        wrapperStyle={{ width: '100%', borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3' }}
      />
    </section>
    {edit && onButtonsChange && !isMobile && (
      <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Nosotros" />
    )}
    </>
  )
}
