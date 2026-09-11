'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { MediaUploadStatus } from '@/lib/types'
import { focalPosition } from '@/lib/types'
import { useEditOptional } from '../admin/EditContext'

// Carga diferida: FocalPointPicker (el modal de "elegir punto focal") solo se
// pinta cuando pickerOpen es true, y eso solo puede pasar en edición — pero
// como el import de arriba era estático, su código igual viajaba al sitio
// público. ssr:false porque es puramente interactivo (arrastrar un punto
// sobre la imagen), no tiene sentido renderizarlo en el servidor.
const FocalPointPicker = dynamic(() => import('../admin/FocalPointPicker'), { ssr: false })

interface EditableImageProps {
  src?: string
  alt?: string
  edit?: boolean
  /** Puede devolver una promesa que resuelva a `true` si la subida salió bien (para abrir el punto focal tras soltar un archivo). */
  onFile?: (file: File) => void | Promise<boolean>
  /** Estado de la subida en curso para esta imagen (barra de progreso / error). */
  upload?: MediaUploadStatus
  /** Punto focal guardado (0-100). Por defecto 50/50 = centro. */
  focalX?: number
  focalY?: number
  /** ancho/alto del recorte real en la página (ej. 16/9, 4/3, 1) — para el selector de punto focal. */
  aspectRatio?: number
  onFocalChange?: (x: number, y: number) => void
  imgStyle?: React.CSSProperties
  wrapperStyle?: React.CSSProperties
}

/**
 * Imagen editable: en modo lectura es un <img> normal. En modo edición muestra
 * un overlay "Cambiar imagen" al pasar el mouse; clic abre el selector de archivo.
 * También acepta arrastrar y soltar un archivo directamente encima. Al elegir o
 * soltar un archivo se sube a Cloudinary de inmediato (con barra de progreso);
 * "Guardar" en la barra del admin solo hace commit de la URL resultante.
 *
 * El icono ⊕ (visible en edición, si hay imagen) abre el selector de punto focal;
 * también se abre solo al terminar de arrastrar y soltar una imagen nueva.
 */
export default function EditableImage({
  src,
  alt,
  edit,
  onFile,
  upload,
  focalX,
  focalY,
  aspectRatio = 1,
  onFocalChange,
  imgStyle,
  wrapperStyle,
}: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploading = !!upload && !upload.error
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [invalidFile, setInvalidFile] = useState(false)
  const invalidTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const objectPosition = focalPosition({ focalX, focalY })

  // isDraggingFile viene de EditProvider (solo existe dentro del /admin); en el sitio
  // público este hook devuelve null y la zona de drop simplemente no se pinta.
  const editCtx = useEditOptional()
  const dropZoneActive = editCtx?.isDraggingFile === 'image'

  useEffect(() => {
    return () => {
      if (invalidTimer.current) clearTimeout(invalidTimer.current)
    }
  }, [])

  function flashInvalid() {
    setInvalidFile(true)
    if (invalidTimer.current) clearTimeout(invalidTimer.current)
    invalidTimer.current = setTimeout(() => setInvalidFile(false), 2000)
  }

  async function handleDroppedFile(file: File) {
    if (!file.type.startsWith('image/')) {
      flashInvalid()
      return
    }
    const result = onFile?.(file)
    if (result instanceof Promise) {
      const ok = await result
      if (ok) setPickerOpen(true)
    }
  }

  if (!edit) {
    if (!src) return null
    return (
      <div style={{ position: 'relative', ...wrapperStyle }}>
        <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block', ...imgStyle }} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        cursor: uploading ? 'progress' : 'pointer',
        outline: dropZoneActive ? '2px dashed #3b82f688' : 'none',
        outlineOffset: -2,
        transition: 'outline-color .15s',
        ...wrapperStyle,
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsDragging(false)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleDroppedFile(file)
      }}
    >
      {src ? (
        <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block', ...imgStyle }} />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#00000010',
            color: '#00000066',
            fontSize: 13,
          }}
        >
          Sin imagen
        </div>
      )}

      {uploading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#000000aa',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            padding: 20,
          }}
        >
          <span>Subiendo… {upload!.pct}%</span>
          <div style={{ width: '80%', maxWidth: 220, height: 6, borderRadius: 999, background: '#ffffff33', overflow: 'hidden' }}>
            <div style={{ width: `${upload!.pct}%`, height: '100%', background: '#fff', transition: 'width .2s' }} />
          </div>
        </div>
      ) : (
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
            fontSize: 14,
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
          🖼️ Cambiar imagen
        </div>
      )}

      {isDragging && !uploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#00000080',
            border: '2px dashed #fff',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }}>↑</span>
          <span>Suelta para cambiar</span>
        </div>
      )}

      {invalidFile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#c0392bcc',
            border: '2px dashed #fff',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
            padding: 16,
            pointerEvents: 'none',
          }}
        >
          Solo se aceptan imágenes
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
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid #ffffff88',
            background: '#000000aa',
            color: '#fff',
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ⊕
        </button>
      )}

      {upload?.error && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '8px 12px',
            background: '#c0392b',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ⚠ {upload.error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile?.(file)
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
