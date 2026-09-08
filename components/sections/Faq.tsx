'use client'

import type { FaqData, FaqItem } from '@/lib/types'
import { newItemId } from '@/lib/types'
import EditableText from '../editable/EditableText'
import { AddButton, ItemControls, SectionHeading, SectionShell, moved } from './sectionKit'

export default function Faq({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: FaqData
  edit?: boolean
  onChange?: (data: FaqData) => void
}) {
  const items = data.items ?? []
  const set = (next: FaqItem[]) => onChange?.({ ...data, items: next })

  if (!edit && items.length === 0 && !data.heading) return null

  return (
    <SectionShell id={id}>
      <SectionHeading
        heading={data.heading}
        edit={edit}
        onChange={(v) => onChange?.({ ...data, heading: v })}
        eyebrow="Preguntas frecuentes"
      />
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '18px 20px', background: '#fff' }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <EditableText
                as="h3"
                edit={edit}
                value={item.question}
                onChange={(v) => set(items.map((x) => (x.id === item.id ? { ...x, question: v } : x)))}
                placeholder="Pregunta"
                style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink)', flex: 1 }}
              />
              {edit && (
                <ItemControls
                  index={i}
                  count={items.length}
                  label="esta pregunta"
                  onMove={(dir) => set(moved(items, i, dir))}
                  onRemove={() => set(items.filter((x) => x.id !== item.id))}
                />
              )}
            </div>
            <EditableText
              as="p"
              edit={edit}
              value={item.answer}
              onChange={(v) => set(items.map((x) => (x.id === item.id ? { ...x, answer: v } : x)))}
              placeholder="Respuesta"
              style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-soft)' }}
            />
          </div>
        ))}
        {edit && (
          <AddButton onClick={() => set([...items, { id: newItemId(), question: '', answer: '' }])}>
            + Añadir pregunta
          </AddButton>
        )}
      </div>
    </SectionShell>
  )
}
