'use client'

import { useRef } from 'react'

interface EditableImageProps {
  src?: string
  alt?: string
  edit?: boolean
  onFile?: (file: File) => void
  imgStyle?: React.CSSProperties
  wrapperStyle?: React.CSSProperties
}

/**
 * Imagen editable: en modo lectura es un <img> normal. En modo edición muestra
 * un overlay "Cambiar imagen" al pasar el mouse; clic abre el selector de archivo.
 * El archivo se sube de verdad recién al presionar "Guardar" en la barra del admin.
 */
export default function EditableImage({ src, alt, edit, onFile, imgStyle, wrapperStyle }: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!edit) {
    if (!src) return null
    return (
      <div style={{ position: 'relative', ...wrapperStyle }}>
        <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imgStyle }} />
      </div>
    )
  }

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer', ...wrapperStyle }}
      onClick={() => inputRef.current?.click()}
    >
      {src ? (
        <img src={src} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imgStyle }} />
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile?.(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
