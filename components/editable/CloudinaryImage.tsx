'use client'

import { useRef, useState } from 'react'
import { focalPosition } from '@/lib/types'
import { uploadMediaToCloudinary } from '@/lib/upload'
import FocalPointPicker from '../admin/FocalPointPicker'

/**
 * Imagen con subida a Cloudinary autocontenida (progreso propio). En modo lectura
 * es un <img> normal. En edición: clic → elegir archivo → sube → `onUploaded(url)`.
 * El icono ⊕ (si hay imagen) abre el selector de punto focal → `onFocalChange(x, y)`.
 * Se usa en las secciones dinámicas (tarjetas de menú, galería…).
 */
export default function CloudinaryImage({
  src,
  alt,
  edit,
  onUploaded,
  focalX,
  focalY,
  aspectRatio = 1,
  onFocalChange,
  wrapperStyle,
  imgStyle,
}: {
  src?: string
  alt?: string
  edit?: boolean
  onUploaded?: (url: string) => void
  focalX?: number
  focalY?: number
  /** ancho/alto del recorte real en la página (ej. 4/3, 1, 16/9) — para el selector de punto focal. */
  aspectRatio?: number
  onFocalChange?: (x: number, y: number) => void
  wrapperStyle?: React.CSSProperties
  imgStyle?: React.CSSProperties
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const uploading = pct !== null
  const objectPosition = focalPosition({ focalX, focalY })

  async function handleFile(file: File) {
    setError(null)
    setPct(0)
    try {
      const url = await uploadMediaToCloudinary(file, 'image', setPct)
      onUploaded?.(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      setPct(null)
    }
  }

  const img = src ? (
    <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block', ...imgStyle }} />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#00000010',
        color: '#00000066',
        fontSize: 13,
      }}
    >
      {edit ? 'Clic para subir una foto' : 'Sin imagen'}
    </div>
  )

  if (!edit) {
    if (!src) return null
    return <div style={{ position: 'relative', ...wrapperStyle }}>{img}</div>
  }

  return (
    <div
      style={{ position: 'relative', cursor: uploading ? 'progress' : 'pointer', ...wrapperStyle }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {img}
      {uploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#000000aa',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>Subiendo… {pct}%</span>
          <div style={{ width: '70%', height: 5, borderRadius: 999, background: '#ffffff33', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#fff', transition: 'width .2s' }} />
          </div>
        </div>
      )}
      {!uploading && (
        <div
          className="editable-image-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#00000000',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            opacity: 0,
            transition: 'opacity .15s, background-color .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = '#00000066'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0'
            e.currentTarget.style.background = '#00000000'
          }}
        >
          🖼️ {src ? 'Cambiar' : 'Subir'} foto
        </div>
      )}

      {src && !uploading && onFocalChange && (
        <button
          type="button"
          title="Elegir punto focal"
          onClick={(e) => {
            e.stopPropagation()
            setPickerOpen(true)
          }}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: '1px solid #ffffff88',
            background: '#000000aa',
            color: '#fff',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ⊕
        </button>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '6px 10px',
            background: '#c0392b',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          ⚠ {error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {pickerOpen && src && (
        <FocalPointPicker
          src={src}
          aspectRatio={aspectRatio}
          focalX={focalX}
          focalY={focalY}
          onApply={(x, y) => {
            onFocalChange?.(x, y)
            setPickerOpen(false)
          }}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
