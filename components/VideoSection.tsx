'use client'

import { useEffect, useRef } from 'react'
import type { VideoSectionData } from '@/sanity/lib/types'

export default function VideoSection({ data }: { data?: VideoSectionData }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = data?.video?.asset?.url

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
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
  }, [videoUrl])

  if (!data) return null

  return (
    <section id="video" style={{ padding: '20px 6vw 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
        {data.eyebrow && (
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {data.eyebrow}
          </span>
        )}
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(28px,3.5vw,42px)',
            margin: '12px 0 0',
            color: 'var(--ink)',
          }}
        >
          {data.heading}
        </h2>
      </div>
      {videoUrl && (
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 24px 60px -20px oklch(27% 0.035 45 / 0.267)',
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            muted
            loop
            playsInline
            preload="none"
            style={{ width: '100%', display: 'block', background: '#000' }}
          />
        </div>
      )}
    </section>
  )
}
