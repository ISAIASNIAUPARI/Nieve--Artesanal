'use client'

import type { HeroSectionData } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'

interface HeroProps {
  data?: HeroSectionData
  edit?: boolean
  onChange?: (field: keyof HeroSectionData, value: string) => void
  onImageChange?: (field: keyof HeroSectionData, file: File) => void
}

export default function Hero({ data, edit, onChange, onImageChange }: HeroProps) {
  if (!data) return null
  const showSecondary = edit || Boolean(data.secondaryButtonText && data.secondaryButtonLink)

  return (
    <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
      <EditableImage
        src={data.backgroundImage?.src}
        alt={data.backgroundImage?.alt}
        edit={edit}
        onFile={(file) => onImageChange?.('backgroundImage', file)}
        wrapperStyle={{ position: 'absolute', inset: 0 }}
        imgStyle={{ objectPosition: 'center 30%' }}
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(edit || (data.primaryButtonText && data.primaryButtonLink)) && (
            <a
              href={data.primaryButtonLink || '#'}
              onClick={(e) => edit && e.preventDefault()}
              style={{
                padding: '14px 30px',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              <EditableText edit={edit} value={data.primaryButtonText} onChange={(v) => onChange?.('primaryButtonText', v)} stopClickNavigation />
            </a>
          )}
          {showSecondary && (
            <a
              href={data.secondaryButtonLink || '#'}
              onClick={(e) => edit && e.preventDefault()}
              style={{
                padding: '14px 30px',
                background: 'transparent',
                border: '1px solid #fff',
                color: '#fff',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              <EditableText
                edit={edit}
                value={data.secondaryButtonText}
                onChange={(v) => onChange?.('secondaryButtonText', v)}
                stopClickNavigation
              />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
