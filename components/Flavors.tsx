'use client'

import type { FlavorsSectionData, ImageValue } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'

function Tile({
  image,
  caption,
  edit,
  style,
  onImageFile,
  onCaptionChange,
}: {
  image?: ImageValue
  caption?: string
  edit?: boolean
  style: React.CSSProperties
  onImageFile?: (file: File) => void
  onCaptionChange?: (value: string) => void
}) {
  if (!edit && !image?.src) return null
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', ...style }}>
      <EditableImage src={image?.src} alt={image?.alt} edit={edit} onFile={onImageFile} wrapperStyle={{ width: '100%', height: '100%' }} />
      {(edit || caption) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 20,
            background: 'linear-gradient(0deg, #000000aa, transparent)',
          }}
        >
          <EditableText
            edit={edit}
            value={caption}
            onChange={onCaptionChange}
            placeholder="Leyenda de la foto"
            style={{ color: '#fff', fontWeight: 600, margin: 0 }}
          />
        </div>
      )}
    </div>
  )
}

interface FlavorsProps {
  data?: FlavorsSectionData
  edit?: boolean
  onChange?: (field: keyof FlavorsSectionData, value: string) => void
  onImageChange?: (field: keyof FlavorsSectionData, file: File) => void
}

export default function Flavors({ data, edit, onChange, onImageChange }: FlavorsProps) {
  if (!data) return null

  return (
    <section id="sabores" style={{ padding: '20px 6vw 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
        <EditableText
          edit={edit}
          value={data.eyebrow}
          onChange={(v) => onChange?.('eyebrow', v)}
          placeholder="Antetítulo"
          style={{ display: 'inline-block', color: 'var(--accent)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}
        />
        <EditableText
          as="h2"
          edit={edit}
          value={data.heading}
          onChange={(v) => onChange?.('heading', v)}
          placeholder="Título de la sección"
          style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 'clamp(28px,3.5vw,42px)', margin: '12px 0 0', color: 'var(--ink)' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: 'auto auto', gap: 20 }}>
        <Tile
          image={data.featuredImage}
          caption={data.featuredImageCaption}
          edit={edit}
          style={{ gridRow: 'span 2' }}
          onImageFile={(file) => onImageChange?.('featuredImage', file)}
          onCaptionChange={(v) => onChange?.('featuredImageCaption', v)}
        />
        <Tile
          image={data.secondaryImage1}
          caption={data.secondaryImage1Caption}
          edit={edit}
          style={{ aspectRatio: '4/3' }}
          onImageFile={(file) => onImageChange?.('secondaryImage1', file)}
          onCaptionChange={(v) => onChange?.('secondaryImage1Caption', v)}
        />
        <Tile
          image={data.secondaryImage2}
          caption={data.secondaryImage2Caption}
          edit={edit}
          style={{ aspectRatio: '4/3' }}
          onImageFile={(file) => onImageChange?.('secondaryImage2', file)}
          onCaptionChange={(v) => onChange?.('secondaryImage2Caption', v)}
        />
      </div>
      {(edit || data.bannerImage?.src) && (
        <div style={{ marginTop: 20 }}>
          <Tile
            image={data.bannerImage}
            caption={data.bannerImageCaption}
            edit={edit}
            style={{ aspectRatio: '21/7' }}
            onImageFile={(file) => onImageChange?.('bannerImage', file)}
            onCaptionChange={(v) => onChange?.('bannerImageCaption', v)}
          />
        </div>
      )}
    </section>
  )
}
