'use client'

import { useEffect, useRef } from 'react'
import type { VideoSectionData } from '@/lib/types'
import EditableText from './editable/EditableText'

interface VideoSectionProps {
  data?: VideoSectionData
  edit?: boolean
  onChange?: (field: keyof VideoSectionData, value: string) => void
  onVideoFile?: (file: File) => void
}

export default function VideoSection({ data, edit, onChange, onVideoFile }: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoUrl = data?.video?.src

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
            cursor: edit ? 'pointer' : undefined,
            minHeight: edit && !videoUrl ? 240 : undefined,
            background: edit && !videoUrl ? '#00000010' : undefined,
          }}
          onClick={() => edit && fileInputRef.current?.click()}
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
          {edit && (
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
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onVideoFile?.(file)
              e.target.value = ''
            }}
          />
        </div>
      )}
    </section>
  )
}
