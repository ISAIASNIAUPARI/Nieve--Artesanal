'use client'

import type { Button, HeroSectionData, MediaUploadStatus } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'
import SectionButtons from './sections/SectionButtons'
import dynamic from 'next/dynamic'

// Solo se pinta en /admin — cargado aparte para que el sitio público nunca
// descargue su código (ni el de @dnd-kit, del que depende SectionButtons).
const ButtonsEditor = dynamic(() => import('./admin/ButtonsEditor'), { ssr: false })
import { useIsMobileView } from './useIsMobileView'

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
  const isMobile = useIsMobileView()
  if (!data) return null

  return (
    <>
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
      {/* Hijo normal (no position:absolute) del <section> flex — así el contenido
          SIGUE DICTANDO el alto de la sección cuando es más alto que minHeight:88vh
          (pasa en edición: el panel de botones puede ser bien largo). Con
          position:absolute+inset:0 el contenido queda "atrapado" en un alto fijo y
          se desborda simétricamente hacia arriba/abajo — el título terminaba
          empujado fuera de la pantalla, por encima del hero. El canvas de posición
          libre de los botones (SectionButtons) igual bubblea hasta este <section>
          (position:relative) porque este wrapper no fija su propio position. */}
      <div
        style={{
          zIndex: 2,
          width: '100%',
          padding: isMobile ? '40px 20px' : '0 6vw',
        }}
      >
        <div style={{ maxWidth: 640, animation: 'fadeUp .8s ease' }}>
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
              marginBottom: isMobile ? 14 : 20,
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
                fontSize: isMobile ? 34 : 'clamp(38px, 5.5vw, 68px)',
                lineHeight: 1.15,
                color: '#fff',
                margin: isMobile ? '0 0 14px' : '0 0 20px',
              }}
            />
          </div>
          <EditableText
            as="p"
            edit={edit}
            value={data.description}
            onChange={(v) => onChange?.('description', v)}
            placeholder="Descripción breve"
            style={{
              fontSize: isMobile ? 15 : 18,
              lineHeight: 1.6,
              color: '#f2ede6',
              margin: isMobile ? '0 0 22px' : '0 0 32px',
              maxWidth: 480,
            }}
          />
          <SectionButtons buttons={data.buttons} tone="dark" edit={edit} onReorder={onButtonsChange} />
        </div>
      </div>
    </section>
    {/* Fuera del <section> a propósito — si viviera adentro, el panel (que crece
        con cada botón agregado) inflaría el alto de la sección, y como el canvas
        de posición libre mide sus % contra ESE alto, los botones ya colocados se
        verían "correr" cada vez que el panel cambia de tamaño. Ver Fase D, Parte 8. */}
    {edit && onButtonsChange && !isMobile && (
      <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Portada" />
    )}
    </>
  )
}
