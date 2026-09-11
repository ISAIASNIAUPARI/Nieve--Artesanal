'use client'

import type { CtaBannerData } from '@/lib/types'
import EditableText from '../editable/EditableText'
import CloudinaryImage from '../editable/CloudinaryImage'
import SectionButtons from './SectionButtons'
import ButtonsEditor from '../admin/ButtonsEditor'

export default function CtaBanner({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: CtaBannerData
  edit?: boolean
  onChange?: (data: CtaBannerData) => void
}) {
  return (
    <section id={id} style={{ position: 'relative', padding: '80px 6vw', background: 'var(--accent)', color: '#fff', overflow: 'hidden' }}>
      {(edit || data.image?.src) && (
        <CloudinaryImage
          src={data.image?.src}
          alt={data.image?.alt}
          edit={edit}
          onUploaded={(url) => onChange?.({ ...data, image: { ...data.image, src: url } })}
          focalX={data.image?.focalX}
          focalY={data.image?.focalY}
          aspectRatio={16 / 9}
          onFocalChange={(x, y) =>
            onChange?.({ ...data, image: { src: data.image?.src ?? '', alt: data.image?.alt, focalX: x, focalY: y } })
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
        <EditableText
          as="h2"
          edit={edit}
          value={data.heading}
          onChange={(v) => onChange?.({ ...data, heading: v })}
          placeholder="Título del banner"
          style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 'clamp(26px,3.4vw,40px)', margin: 0, color: '#fff' }}
        />
        <EditableText
          as="p"
          edit={edit}
          value={data.description}
          onChange={(v) => onChange?.({ ...data, description: v })}
          placeholder="Texto de apoyo"
          style={{ fontSize: 17, lineHeight: 1.6, margin: 0, color: '#fff', opacity: 0.95 }}
        />
        <SectionButtons buttons={data.buttons} tone="onAccent" edit={edit} align="center" style={{ marginTop: 8 }} />
        {edit && onChange && (
          <ButtonsEditor
            buttons={data.buttons ?? []}
            onChange={(b) => onChange({ ...data, buttons: b })}
            sectionLabel="Banner"
            max={2}
          />
        )}
      </div>
    </section>
  )
}
