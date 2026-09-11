'use client'

import { useEffect, useRef, useState } from 'react'
import type { Button, MediaUploadStatus, VideoSectionData } from '@/lib/types'
import EditableText from './editable/EditableText'
import SectionButtons from './sections/SectionButtons'
import ButtonsEditor from './admin/ButtonsEditor'
import { useEditOptional } from './admin/EditProvider'

interface VideoSectionProps {
  data?: VideoSectionData
  edit?: boolean
  onChange?: (field: keyof VideoSectionData, value: string) => void
  onButtonsChange?: (buttons: Button[]) => void
  onVideoFile?: (file: File) => void
  /** Estado de la subida del video en curso (barra de progreso / error). */
  upload?: MediaUploadStatus
}

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

export default function VideoSection({ data, edit, onChange, onButtonsChange, onVideoFile, upload }: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoUrl = data?.video?.src
  const uploading = !!upload && !upload.error

  const [isDragging, setIsDragging] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)
  const dropErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // isDraggingFile viene de EditProvider (solo existe dentro del /admin); en el sitio
  // público este hook devuelve null y la zona de drop simplemente no se pinta.
  const editCtx = useEditOptional()
  const dropZoneActive = editCtx?.isDraggingFile === 'video'

  useEffect(() => {
    return () => {
      if (dropErrorTimer.current) clearTimeout(dropErrorTimer.current)
    }
  }, [])

  function flashDropError(message: string, ms: number) {
    setDropError(message)
    if (dropErrorTimer.current) clearTimeout(dropErrorTimer.current)
    dropErrorTimer.current = setTimeout(() => setDropError(null), ms)
  }

  function handleDroppedFile(file: File) {
    if (!VIDEO_TYPES.includes(file.type)) {
      flashDropError('Solo se aceptan videos (mp4, mov, webm)', 2000)
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      flashDropError('El video supera el límite de 200 MB', 3000)
      return
    }
    onVideoFile?.(file)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || edit) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [videoUrl, edit])

  if (!data) return null

  return (
    <section id="video" style={{ padding: '20px 6vw 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
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
      {(edit || videoUrl) && (
        <div
          style={{
            position: 'relative',
            maxWidth: 900,
            margin: '0 auto',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 24px 60px -20px oklch(27% 0.035 45 / 0.267)',
            cursor: edit && !uploading ? 'pointer' : undefined,
            minHeight: edit && !videoUrl ? 240 : undefined,
            background: edit && !videoUrl ? '#00000010' : undefined,
            outline: edit && dropZoneActive ? '2px dashed #3b82f688' : 'none',
            outlineOffset: -2,
            transition: 'outline-color .15s',
          }}
          onClick={() => edit && !uploading && fileInputRef.current?.click()}
          onDragEnter={(e) => {
            if (!edit) return
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(true)
          }}
          onDragOver={(e) => {
            if (!edit) return
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDragLeave={(e) => {
            if (!edit) return
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsDragging(false)
            }
          }}
          onDrop={(e) => {
            if (!edit) return
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleDroppedFile(file)
          }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls={!edit}
              muted
              loop
              playsInline
              preload="none"
              style={{ width: '100%', display: 'block', background: '#000', pointerEvents: edit ? 'none' : undefined }}
            />
          ) : (
            edit && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: '#00000066', fontSize: 14 }}>
                🎬 Clic para subir un video
              </div>
            )
          )}

          {edit && uploading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                background: '#000000cc',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                padding: 24,
              }}
            >
              <span>Subiendo video… {upload!.pct}%</span>
              <div style={{ width: '70%', maxWidth: 320, height: 8, borderRadius: 999, background: '#ffffff33', overflow: 'hidden' }}>
                <div style={{ width: `${upload!.pct}%`, height: '100%', background: '#fff', transition: 'width .2s' }} />
              </div>
              <span style={{ opacity: 0.7, fontWeight: 400, fontSize: 12 }}>Los videos tardan más — no cierres esta pestaña.</span>
            </div>
          )}

          {edit && isDragging && !uploading && (
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
              <span style={{ fontSize: 32, lineHeight: 1 }}>🎬</span>
              <span>Suelta para cambiar el video</span>
            </div>
          )}

          {edit && dropError && (
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
              {dropError}
            </div>
          )}

          {edit && !uploading && !isDragging && !dropError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              🎬 Cambiar video
            </div>
          )}

          {edit && upload?.error && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '10px 14px',
                background: '#c0392b',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠ {upload.error}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onVideoFile?.(file)
              e.target.value = ''
            }}
          />
        </div>
      )}
      <SectionButtons buttons={data.buttons} tone="light" edit={edit} onReorder={onButtonsChange} align="center" style={{ marginTop: 40 }} />
      {edit && onButtonsChange && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Video" />
        </div>
      )}
    </section>
  )
}
