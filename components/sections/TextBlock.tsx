'use client'

import type { TextBlockData, TextParagraph } from '@/lib/types'
import { newItemId } from '@/lib/types'
import EditableText from '../editable/EditableText'
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
  onChange?: (data: TextBlockData) => void
}) {
  const paragraphs = data.paragraphs ?? []
  const set = (next: TextParagraph[]) => onChange?.({ ...data, paragraphs: next })

  if (!edit && paragraphs.length === 0 && !data.heading) return null

  return (
    <SectionShell id={id}>
      <SectionHeading heading={data.heading} edit={edit} onChange={(v) => onChange?.({ ...data, heading: v })} />
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {paragraphs.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <EditableText
              as="p"
              edit={edit}
              value={p.text}
              onChange={(v) => set(paragraphs.map((x) => (x.id === p.id ? { ...x, text: v } : x)))}
              placeholder="Escribe un párrafo…"
              style={{ flex: 1, fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0 }}
            />
            {edit && (
              <ItemControls
                index={i}
                count={paragraphs.length}
                label="este párrafo"
                onMove={(dir) => set(moved(paragraphs, i, dir))}
                onRemove={() => set(paragraphs.filter((x) => x.id !== p.id))}
              />
            )}
          </div>
        ))}
        {edit && (
          <AddButton onClick={() => set([...paragraphs, { id: newItemId(), text: '' }])}>+ Añadir párrafo</AddButton>
        )}
      </div>
    </SectionShell>
  )
}
