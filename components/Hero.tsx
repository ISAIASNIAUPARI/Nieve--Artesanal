'use client'

import type { Button, HeroSectionData, MediaUploadStatus } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'
import SectionButtons from './sections/SectionButtons'
import ButtonsEditor from './admin/ButtonsEditor'

interface HeroProps {
  data?: HeroSectionData
  edit?: boolean
  onChange?: (field: keyof HeroSectionData, value: string) => void
  onButtonsChange?: (buttons: Button[]) => void
  onImageChange?: (field: keyof HeroSectionData, file: File) => void
  onFocalChange?: (field: keyof HeroSectionData, x: number, y: number) => void
  uploads?: Record<string, MediaUploadStatus>
}

export default function Hero({ data, edit, onChange, onButtonsChange, onImageChange, onFocalChange, uploads }: HeroProps) {
  if (!data) return null

  return (
    <section id="hero" style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
      <EditableImage
        src={data.backgroundImage?.src}
        alt={data.backgroundImage?.alt}
        edit={edit}
        onFile={(file) => onImageChange?.('backgroundImage', file)}
        upload={uploads?.backgroundImage}
        focalX={data.backgroundImage?.focalX}
        focalY={data.backgroundImage?.focalY}
        aspectRatio={16 / 9}
        onFocalChange={(x, y) => onFocalChange?.('backgroundImage', x, y)}
        wrapperStyle={{ position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, oklch(27% 0.035 45 / 0.867) 0%, oklch(27% 0.035 45 / 0.533) 45%, oklch(27% 0.035 45 / 0.133) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, padding: '0 6vw', maxWidth: 640, animation: 'fadeUp .8s ease' }}>
        <EditableText
          edit={edit}
          value={data.badgeText}
          onChange={(v) => onChange?.('badgeText', v)}
          placeholder="Etiqueta (ej. Heladería artesanal)"
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            border: '1px solid #ffffff55',
            borderRadius: 999,
            color: '#fff',
            fontSize: 13,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        />
        <div>
          <EditableText
            as="h1"
            edit={edit}
            value={data.heading}
            onChange={(v) => onChange?.('heading', v)}
            placeholder="Título principal"
            style={{
              fontFamily: 'var(--font-dm-serif), serif',
              fontSize: 'clamp(38px, 5.5vw, 68px)',
              lineHeight: 1.05,
              color: '#fff',
              margin: '0 0 20px',
            }}
          />
        </div>
        <EditableText
          as="p"
          edit={edit}
          value={data.description}
          onChange={(v) => onChange?.('description', v)}
          placeholder="Descripción breve"
          style={{ fontSize: 18, lineHeight: 1.6, color: '#f2ede6', margin: '0 0 32px', maxWidth: 480 }}
        />
        <SectionButtons buttons={data.buttons} tone="dark" edit={edit} />
        {edit && onButtonsChange && (
          <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Portada" />
        )}
      </div>
    </section>
  )
}
