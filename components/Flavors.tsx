'use client'

import type { Button, FlavorsSectionData, ImageValue, MediaUploadStatus } from '@/lib/types'
import EditableText from './editable/EditableText'
import EditableImage from './editable/EditableImage'
import SectionButtons from './sections/SectionButtons'
import dynamic from 'next/dynamic'

// Solo se pinta en /admin — cargado aparte para que el sitio público nunca
// descargue su código (ni el de @dnd-kit, del que depende SectionButtons).
const ButtonsEditor = dynamic(() => import('./admin/ButtonsEditor'), { ssr: false })
import { useIsMobileView } from './useIsMobileView'

function Tile({
  image,
  caption,
  edit,
  style,
  aspectRatio,
  onImageFile,
  onCaptionChange,
  onFocalChange,
  upload,
}: {
  image?: ImageValue
  caption?: string
  edit?: boolean
  style: React.CSSProperties
  aspectRatio: number
  onImageFile?: (file: File) => void
  onCaptionChange?: (value: string) => void
  onFocalChange?: (x: number, y: number) => void
  upload?: MediaUploadStatus
}) {
  if (!edit && !image?.src) return null
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', ...style }}>
      <EditableImage
        src={image?.src}
        alt={image?.alt}
        edit={edit}
        onFile={onImageFile}
        upload={upload}
        focalX={image?.focalX}
        focalY={image?.focalY}
        aspectRatio={aspectRatio}
        onFocalChange={onFocalChange}
        wrapperStyle={{ width: '100%', height: '100%' }}
      />
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
  onButtonsChange?: (buttons: Button[]) => void
  onImageChange?: (field: keyof FlavorsSectionData, file: File) => void
  onFocalChange?: (field: keyof FlavorsSectionData, x: number, y: number) => void
  uploads?: Record<string, MediaUploadStatus>
}

export default function Flavors({ data, edit, onChange, onButtonsChange, onImageChange, onFocalChange, uploads }: FlavorsProps) {
  const isMobile = useIsMobileView()
  if (!data) return null

  return (
    <>
    <section id="flavors" style={{ position: 'relative', padding: isMobile ? '20px 20px 48px' : '20px 6vw 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 600, margin: isMobile ? '0 auto 32px' : '0 auto 56px' }}>
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
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: isMobile ? 26 : 'clamp(28px,3.5vw,42px)',
            lineHeight: 1.2,
            margin: '12px 0 0',
            color: 'var(--ink)',
          }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
          gridTemplateRows: isMobile ? undefined : 'auto auto',
          gap: 20,
        }}
      >
        <Tile
          image={data.featuredImage}
          caption={data.featuredImageCaption}
          edit={edit}
          style={isMobile ? {} : { gridRow: 'span 2' }}
          aspectRatio={4 / 3}
          onImageFile={(file) => onImageChange?.('featuredImage', file)}
          onCaptionChange={(v) => onChange?.('featuredImageCaption', v)}
          onFocalChange={(x, y) => onFocalChange?.('featuredImage', x, y)}
          upload={uploads?.featuredImage}
        />
        <Tile
          image={data.secondaryImage1}
          caption={data.secondaryImage1Caption}
          edit={edit}
          style={{ aspectRatio: '4/3' }}
          aspectRatio={1}
          onImageFile={(file) => onImageChange?.('secondaryImage1', file)}
          onCaptionChange={(v) => onChange?.('secondaryImage1Caption', v)}
          onFocalChange={(x, y) => onFocalChange?.('secondaryImage1', x, y)}
          upload={uploads?.secondaryImage1}
        />
        <Tile
          image={data.secondaryImage2}
          caption={data.secondaryImage2Caption}
          edit={edit}
          style={{ aspectRatio: '4/3' }}
          aspectRatio={1}
          onImageFile={(file) => onImageChange?.('secondaryImage2', file)}
          onCaptionChange={(v) => onChange?.('secondaryImage2Caption', v)}
          onFocalChange={(x, y) => onFocalChange?.('secondaryImage2', x, y)}
          upload={uploads?.secondaryImage2}
        />
      </div>
      {(edit || data.bannerImage?.src) && (
        <div style={{ marginTop: 20 }}>
          <Tile
            image={data.bannerImage}
            caption={data.bannerImageCaption}
            edit={edit}
            style={{ aspectRatio: '21/7' }}
            aspectRatio={21 / 7}
            onImageFile={(file) => onImageChange?.('bannerImage', file)}
            onCaptionChange={(v) => onChange?.('bannerImageCaption', v)}
            onFocalChange={(x, y) => onFocalChange?.('bannerImage', x, y)}
            upload={uploads?.bannerImage}
          />
        </div>
      )}
      <SectionButtons buttons={data.buttons} tone="light" edit={edit} onReorder={onButtonsChange} align="center" style={{ marginTop: 44 }} />
    </section>
    {edit && onButtonsChange && !isMobile && (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Sabores" />
      </div>
    )}
    </>
  )
}
