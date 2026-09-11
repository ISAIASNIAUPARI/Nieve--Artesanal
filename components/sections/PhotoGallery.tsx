'use client'

import type { GalleryPhoto, PhotoGalleryData } from '@/lib/types'
import { newItemId } from '@/lib/types'
import EditableText from '../editable/EditableText'
import CloudinaryImage from '../editable/CloudinaryImage'
import { AddButton, ItemControls, SectionHeading, SectionShell, moved } from './sectionKit'

export default function PhotoGallery({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: PhotoGalleryData
  edit?: boolean
  onChange?: (data: PhotoGalleryData | ((prev: PhotoGalleryData) => PhotoGalleryData)) => void
}) {
  const images = data.images ?? []

  // Actualiza a partir del array de fotos MÁS RECIENTE (el que EditProvider tiene en
  // ese momento), nunca del `images` capturado en este render. Con esto, aplicar el
  // punto focal de una foto justo después de subir otra (o de tocar dos fotos casi a
  // la vez) ya no puede perder una de las dos actualizaciones — antes, como cada
  // cambio partía del `data` de su propio cierre, el segundo cambio en llegar podía
  // pisar al primero si React aún no había vuelto a renderizar entre uno y otro.
  const setImages = (updater: (images: GalleryPhoto[]) => GalleryPhoto[]) =>
    onChange?.((prev) => ({ ...prev, images: updater(prev.images ?? []) }))

  const patch = (photoId: string, p: Partial<GalleryPhoto>) =>
    setImages((imgs) => imgs.map((x) => (x.id === photoId ? { ...x, ...p } : x)))

  if (!edit && images.length === 0 && !data.heading) return null

  return (
    <SectionShell id={id}>
      <SectionHeading
        heading={data.heading}
        edit={edit}
        onChange={(v) => onChange?.((prev) => ({ ...prev, heading: v }))}
        subtitle={data.subtitle}
        onSubtitleChange={(v) => onChange?.((prev) => ({ ...prev, subtitle: v }))}
      />
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {images.map((photo, i) => (
          <figure key={photo.id} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
              <CloudinaryImage
                src={photo.image?.src}
                alt={photo.image?.alt || photo.caption}
                edit={edit}
                onUploaded={(url) => patch(photo.id, { image: { ...photo.image, src: url } })}
                focalX={photo.image?.focalX}
                focalY={photo.image?.focalY}
                aspectRatio={4 / 3}
                onFocalChange={(x, y) => patch(photo.id, { image: { ...photo.image, focalX: x, focalY: y } })}
                wrapperStyle={{ width: '100%', height: '100%' }}
              />
            </div>
            {(edit || photo.caption) && (
              <figcaption style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <EditableText
                  edit={edit}
                  value={photo.caption}
                  onChange={(v) => patch(photo.id, { caption: v })}
                  placeholder="Pie de foto"
                  style={{ fontSize: 14, color: 'var(--ink-soft)', flex: 1 }}
                />
                {edit && (
                  <ItemControls
                    index={i}
                    count={images.length}
                    label="esta foto"
                    onMove={(dir) => setImages((imgs) => moved(imgs, i, dir))}
                    onRemove={() => setImages((imgs) => imgs.filter((x) => x.id !== photo.id))}
                  />
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {edit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
          <AddButton onClick={() => setImages((imgs) => [...imgs, { id: newItemId(), image: { src: '' }, caption: '' }])}>
            + Añadir foto
          </AddButton>
        </div>
      )}
    </SectionShell>
  )
}
