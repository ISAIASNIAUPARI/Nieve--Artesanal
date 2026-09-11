'use client'

import type { CtaBannerData } from '@/lib/types'
import EditableText from '../editable/EditableText'
import CloudinaryImage from '../editable/CloudinaryImage'
import SectionButtons from './SectionButtons'
import dynamic from 'next/dynamic'

// Solo se pinta en /admin — cargado aparte para que el sitio público nunca
// descargue su código (ni el de @dnd-kit, del que depende SectionButtons).
const ButtonsEditor = dynamic(() => import('../admin/ButtonsEditor'), { ssr: false })
import { useIsMobileView } from '../useIsMobileView'

export default function CtaBanner({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: CtaBannerData
  edit?: boolean
  onChange?: (data: CtaBannerData | ((prev: CtaBannerData) => CtaBannerData)) => void
}) {
  const isMobile = useIsMobileView()
  return (
    <>
    <section
      id={id}
      style={{
        position: 'relative',
        padding: isMobile ? '48px 20px' : '80px 6vw',
        background: 'var(--accent)',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {(edit || data.image?.src) && (
        <CloudinaryImage
          src={data.image?.src}
          alt={data.image?.alt}
          edit={edit}
          onUploaded={(url) => onChange?.((prev) => ({ ...prev, image: { ...prev.image, src: url } }))}
          focalX={data.image?.focalX}
          focalY={data.image?.focalY}
          aspectRatio={16 / 9}
          onFocalChange={(x, y) =>
            onChange?.((prev) => ({
              ...prev,
              image: { src: prev.image?.src ?? '', alt: prev.image?.alt, focalX: x, focalY: y },
            }))
          }
          wrapperStyle={{ position: 'absolute', inset: 0 }}
        />
      )}
      {data.image?.src && (
        <div style={{ position: 'absolute', inset: 0, background: '#00000055', pointerEvents: 'none' }} />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Cada campo en su propio contenedor de bloque — ver el comentario en sectionKit.tsx
            (aquí el `display:flex; flexDirection:column` del contenedor padre ya los
            apilaba de por sí, pero se envuelve igual para que el apilado no dependa de eso). */}
        {(edit || Boolean(data.subtitle && data.subtitle.trim() !== '')) && (
          <div style={{ display: 'block', width: '100%' }}>
            <EditableText
              edit={edit}
              value={data.subtitle}
              onChange={(v) => onChange?.((prev) => ({ ...prev, subtitle: v }))}
              placeholder="Etiqueta superior (opcional)"
              alwaysShowOutline
              style={{
                display: 'inline-block',
                color: '#fff',
                opacity: 0.85,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            />
          </div>
        )}
        <div style={{ display: 'block', width: '100%' }}>
          <EditableText
            as="h2"
            edit={edit}
            value={data.heading}
            onChange={(v) => onChange?.((prev) => ({ ...prev, heading: v }))}
            placeholder="Título del banner"
            style={{
              fontFamily: 'var(--font-dm-serif), serif',
              fontSize: isMobile ? 25 : 'clamp(26px,3.4vw,40px)',
              lineHeight: 1.2,
              margin: 0,
              color: '#fff',
            }}
          />
        </div>
        <EditableText
          as="p"
          edit={edit}
          value={data.description}
          onChange={(v) => onChange?.((prev) => ({ ...prev, description: v }))}
          placeholder="Texto de apoyo"
          style={{ fontSize: 17, lineHeight: 1.6, margin: 0, color: '#fff', opacity: 0.95 }}
        />
        <SectionButtons
          buttons={data.buttons}
          tone="onAccent"
          edit={edit}
          onReorder={(b) => onChange?.((prev) => ({ ...prev, buttons: b }))}
          align="center"
          style={{ marginTop: 8 }}
        />
      </div>
    </section>
    {edit && onChange && !isMobile && (
      <ButtonsEditor
        buttons={data.buttons ?? []}
        onChange={(b) => onChange((prev) => ({ ...prev, buttons: b }))}
        sectionLabel="Banner"
        max={2}
      />
    )}
    </>
  )
}
