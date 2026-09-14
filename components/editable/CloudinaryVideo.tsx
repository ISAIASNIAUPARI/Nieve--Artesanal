'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditOptional } from '../admin/EditContext'

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

/**
 * Video con subida a Cloudinary autocontenida (progreso propio) — mismo
 * patrón que CloudinaryImage.tsx, pero para video. En modo lectura es un
 * <video> normal con controles nativos. En edición: clic, o arrastrar y
 * soltar un archivo, → sube → `onUploaded(url)`, con el mismo hover
 * "🎬 Cambiar video" que ya usa VideoSection.tsx para el video del hero.
 *
 * El `src` se asigna en useEffect (no como prop en el JSX) — si se usan
 * varios de estos en una misma sección (ej. una grilla de videos), así el
 * navegador no arranca a precargar metadata de todos apenas se monta.
 */
export default function CloudinaryVideo({
  src,
  edit,
  onUploaded,
  wrapperStyle,
}: {
  src?: string
  edit?: boolean
  onUploaded?: (url: string) => void
  wrapperStyle?: React.CSSProperties
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [invalidFile, setInvalidFile] = useState(false)
  const invalidTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uploading = pct !== null

  const editCtx = useEditOptional()
  const dropZoneActive = editCtx?.isDraggingFile === 'video'

  useEffect(() => {
    return () => {
      if (invalidTimer.current) clearTimeout(invalidTimer.current)
    }
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (el && el.src !== src) el.src = src || ''
  }, [src])

  function flashInvalid() {
    setInvalidFile(true)
    if (invalidTimer.current) clearTimeout(invalidTimer.current)
    invalidTimer.current = setTimeout(() => setInvalidFile(false), 2000)
  }

  async function handleFile(file: File) {
    setError(null)
    setPct(0)
    try {
      // import() en vez de un import estático — mismo motivo que en
      // CloudinaryImage.tsx: este componente también se pinta en el sitio
      // público (los videos ya subidos), y el cliente de subida solo debe
      // descargarse si de verdad se llega a llamar esta función (edición).
      const { uploadMediaToCloudinary } = await import('@/lib/upload')
      const url = await uploadMediaToCloudinary(file, 'video', setPct)
      onUploaded?.(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video.')
    } finally {
      setPct(null)
    }
  }

  function handleDroppedFile(file: File) {
    if (!VIDEO_TYPES.includes(file.type)) {
      flashInvalid()
      return
    }
    handleFile(file)
  }

  const video = (
    <video
      ref={videoRef}
      controls={!edit}
      preload="metadata"
      playsInline
      controlsList="nofullscreen nodownload"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover',
        background: '#000',
        pointerEvents: edit ? 'none' : undefined,
      }}
    />
  )

  if (!edit) {
    if (!src) return null
    return <div style={{ position: 'relative', ...wrapperStyle }}>{video}</div>
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
        video
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
            textAlign: 'center',
            padding: 8,
          }}
        >
          🎬 Clic para subir un video
        </div>
      )}

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
            padding: 12,
            textAlign: 'center',
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
            textAlign: 'center',
            padding: 8,
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
          🎬 {src ? 'Cambiar' : 'Subir'} video
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
            gap: 6,
            background: '#00000080',
            border: '2px dashed #fff',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            textAlign: 'center',
            padding: 8,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>🎬</span>
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
            fontSize: 12,
            textAlign: 'center',
            padding: 10,
            pointerEvents: 'none',
          }}
        >
          Solo se aceptan videos (mp4, mov, webm)
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '6px 8px',
            background: '#c0392b',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          ⚠ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
