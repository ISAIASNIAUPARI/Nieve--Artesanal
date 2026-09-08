'use client'

import type { MenuCard, MenuGridData } from '@/lib/types'
import { newItemId } from '@/lib/types'
import EditableText from '../editable/EditableText'
import CloudinaryImage from '../editable/CloudinaryImage'
import { AddButton, ItemControls, SectionHeading, SectionShell, moved } from './sectionKit'

export default function MenuGrid({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: MenuGridData
  edit?: boolean
  onChange?: (data: MenuGridData) => void
}) {
  const items = data.items ?? []
  const set = (next: MenuCard[]) => onChange?.({ ...data, items: next })
  const patch = (cardId: string, p: Partial<MenuCard>) =>
    set(items.map((c) => (c.id === cardId ? { ...c, ...p } : c)))

  if (!edit && items.length === 0 && !data.heading) return null

  return (
    <SectionShell id={id}>
      <SectionHeading heading={data.heading} edit={edit} onChange={(v) => onChange?.({ ...data, heading: v })} />
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 24,
        }}
      >
        {items.map((card, i) => (
          <div
            key={card.id}
            style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}
          >
            <CloudinaryImage
              src={card.image?.src}
              alt={card.image?.alt || card.name}
              edit={edit}
              onUploaded={(url) => patch(card.id, { image: { ...card.image, src: url } })}
              wrapperStyle={{ aspectRatio: '4/3' }}
            />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <EditableText
                  edit={edit}
                  value={card.name}
                  onChange={(v) => patch(card.id, { name: v })}
                  placeholder="Nombre"
                  style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}
                />
                <EditableText
                  edit={edit}
                  value={card.price}
                  onChange={(v) => patch(card.id, { price: v })}
                  placeholder="$0.00"
                  style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', whiteSpace: 'nowrap' }}
                />
              </div>
              <EditableText
                as="p"
                edit={edit}
                value={card.description}
                onChange={(v) => patch(card.id, { description: v })}
                placeholder="Descripción breve"
                style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)' }}
              />
              {edit && (
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <ItemControls
                    index={i}
                    count={items.length}
                    label={`la tarjeta "${card.name || 'sin nombre'}"`}
                    onMove={(dir) => set(moved(items, i, dir))}
                    onRemove={() => set(items.filter((x) => x.id !== card.id))}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
          <AddButton
            onClick={() =>
              set([...items, { id: newItemId(), image: { src: '' }, name: '', price: '', description: '' }])
            }
          >
            + Añadir tarjeta
          </AddButton>
        </div>
      )}
    </SectionShell>
  )
}
