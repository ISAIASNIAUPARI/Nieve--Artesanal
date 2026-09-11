'use client'

import type { TextBlockData, TextParagraph } from '@/lib/types'
import { newItemId } from '@/lib/types'
import EditableText from '../editable/EditableText'
import CloudinaryImage from '../editable/CloudinaryImage'
import { AddButton, ItemControls, SectionHeading, SectionShell, moved } from './sectionKit'

export default function TextBlock({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: TextBlockData
  edit?: boolean
  onChange?: (data: TextBlockData | ((prev: TextBlockData) => TextBlockData)) => void
}) {
  const paragraphs = data.paragraphs ?? []

  // Parte siempre de los párrafos más recientes (ver el comentario en PhotoGallery.tsx).
  const setParagraphs = (updater: (paragraphs: TextParagraph[]) => TextParagraph[]) =>
    onChange?.((prev) => ({ ...prev, paragraphs: updater(prev.paragraphs ?? []) }))

  if (!edit && paragraphs.length === 0 && !data.heading) return null

  return (
    <SectionShell id={id}>
      <SectionHeading
        heading={data.heading}
        edit={edit}
        onChange={(v) => onChange?.((prev) => ({ ...prev, heading: v }))}
        subtitle={data.subtitle}
        onSubtitleChange={(v) => onChange?.((prev) => ({ ...prev, subtitle: v }))}
      />
      {(edit || data.image?.src) && (
        <CloudinaryImage
          src={data.image?.src}
          alt={data.image?.alt}
          edit={edit}
          onUploaded={(url) => onChange?.((prev) => ({ ...prev, image: { ...prev.image, src: url } }))}
          focalX={data.image?.focalX}
          focalY={data.image?.focalY}
          aspectRatio={3 / 2}
          onFocalChange={(x, y) =>
            onChange?.((prev) => ({
              ...prev,
              image: { src: prev.image?.src ?? '', alt: prev.image?.alt, focalX: x, focalY: y },
            }))
          }
          wrapperStyle={{ maxWidth: 680, margin: '0 auto 32px', borderRadius: 16, overflow: 'hidden', aspectRatio: '3/2' }}
        />
      )}
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {paragraphs.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <EditableText
              as="p"
              edit={edit}
              value={p.text}
              onChange={(v) => setParagraphs((paras) => paras.map((x) => (x.id === p.id ? { ...x, text: v } : x)))}
              placeholder="Escribe un párrafo…"
              style={{ flex: 1, fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0 }}
            />
            {edit && (
              <ItemControls
                index={i}
                count={paragraphs.length}
                label="este párrafo"
                onMove={(dir) => setParagraphs((paras) => moved(paras, i, dir))}
                onRemove={() => setParagraphs((paras) => paras.filter((x) => x.id !== p.id))}
              />
            )}
          </div>
        ))}
        {edit && (
          <AddButton onClick={() => setParagraphs((paras) => [...paras, { id: newItemId(), text: '' }])}>
            + Añadir párrafo
          </AddButton>
        )}
      </div>
    </SectionShell>
  )
}
