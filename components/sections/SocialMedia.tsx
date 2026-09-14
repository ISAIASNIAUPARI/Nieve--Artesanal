'use client'

import { useEffect, useRef } from 'react'
import type { SocialMediaSection } from '@/lib/types'
import { safeHref } from '@/lib/types'
import { SectionHeading, SectionShell } from './sectionKit'

/** URLs fijas — no forman parte del dato de la sección (nunca cambian por cliente). */
const LOGOS = {
  facebook: {
    src: 'https://res.cloudinary.com/foewxv45/image/upload/q_auto,f_auto/redes-sociales/fb-logo.png',
    label: 'Facebook',
  },
  tiktok: {
    src: 'https://res.cloudinary.com/foewxv45/image/upload/q_auto,f_auto/redes-sociales/tiktok-logo.png',
    label: 'TikTok',
  },
  instagram: {
    src: 'https://res.cloudinary.com/foewxv45/image/upload/q_auto,f_auto/redes-sociales/insta-logo.png',
    label: 'Instagram',
  },
} as const

const hr: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  border: 0,
  borderTop: '1px solid var(--line)',
}

const editInput: React.CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '5px 7px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--ink)',
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
}

/**
 * Sección de redes sociales: logos clicables (Facebook/TikTok/Instagram) +
 * grid de 4 videos verticales reproducibles en la página, basada en el
 * diseño del ZIP de Claude Design ("Plantilla de redes sociales").
 *
 * Los `src` de los <video> se asignan en useEffect (no como prop `src` en el
 * JSX) a propósito — así el navegador no arranca a precargar metadata de los
 * 4 videos apenas se parsea el HTML, solo después de montar.
 *
 * Solo animación de opacity (vía el `fadeUp` de globals.css, que usa
 * margin-top en vez de transform) — un transform activo en un contenedor
 * convierte a este elemento en containing block de sus descendientes
 * position:absolute, y el overlay "Fondo" de SectionShell es justo eso
 * (ver el mismo comentario en globals.css). El hover de los logos sí usa
 * transform: no tienen ningún descendiente position:absolute.
 */
export default function SocialMedia({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: SocialMediaSection
  edit?: boolean
  onChange?: (data: SocialMediaSection | ((prev: SocialMediaSection) => SocialMediaSection)) => void
}) {
  const videos = data.videos ?? []
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    videos.forEach((src, i) => {
      const el = videoRefs.current[i]
      if (el && el.src !== src) el.src = src || ''
    })
  }, [videos])

  const updateLink = (network: keyof SocialMediaSection['links'], value: string) =>
    onChange?.((prev) => ({ ...prev, links: { ...prev.links, [network]: value } }))

  const updateVideo = (index: number, value: string) =>
    onChange?.((prev) => {
      const next = [...(prev.videos ?? [])]
      next[index] = value
      return { ...prev, videos: next }
    })

  return (
    <SectionShell
      id={id}
      edit={edit}
      backgroundColor={data.backgroundColor}
      onBackgroundColorChange={(next) => onChange?.((prev) => ({ ...prev, backgroundColor: next }))}
    >
      <div style={{ animation: 'fadeUp .8s ease' }}>
        <SectionHeading
          heading={data.title}
          edit={edit}
          onChange={(v) => onChange?.((prev) => ({ ...prev, title: v }))}
          subtitle={data.subtitle}
          onSubtitleChange={(v) => onChange?.((prev) => ({ ...prev, subtitle: v }))}
        />
      </div>

      <hr style={hr} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 48,
          flexWrap: 'wrap',
          padding: '40px 0',
          animation: 'fadeUp .8s ease',
        }}
      >
        {(Object.keys(LOGOS) as (keyof typeof LOGOS)[]).map((network) => (
          <div key={network} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 140 }}>
            <a
              href={safeHref(data.links?.[network])}
              target={edit ? undefined : '_blank'}
              rel={edit ? undefined : 'noopener noreferrer'}
              onClick={(e) => {
                if (edit) e.preventDefault()
              }}
              className="na-social-link"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                color: 'var(--ink)',
                cursor: edit ? 'default' : 'pointer',
                transition: 'transform .2s',
              }}
            >
              <div
                className="na-social-box"
                style={{
                  width: 88,
                  height: 88,
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg)',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              >
                {/* Logo fijo servido por Cloudinary, no un ImageValue editable — next/image no aporta acá. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGOS[network].src} alt={LOGOS[network].label} style={{ width: 64, height: 64, objectFit: 'contain' }} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-dm-serif), serif',
                  color: 'var(--ink-soft)',
                }}
              >
                {LOGOS[network].label}
              </span>
            </a>
            {edit && (
              <input
                type="text"
                value={data.links?.[network] || ''}
                onChange={(e) => updateLink(network, e.target.value)}
                placeholder="https://…"
                style={editInput}
              />
            )}
          </div>
        ))}
      </div>

      <hr style={hr} />

      <div
        className="na-social-videos-grid"
        style={{ marginTop: 48, maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', animation: 'fadeUp .8s ease' }}
      >
        {videos.map((src, i) => (
          <div key={i}>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', background: '#000' }}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el
                }}
                controls
                preload="metadata"
                playsInline
                controlsList="nofullscreen nodownload"
                style={{ width: '100%', aspectRatio: '9/16', display: 'block', objectFit: 'cover', background: '#000' }}
              />
            </div>
            {edit && (
              <input
                type="text"
                value={src || ''}
                onChange={(e) => updateVideo(i, e.target.value)}
                placeholder={`URL video ${i + 1}`}
                style={editInput}
              />
            )}
          </div>
        ))}
      </div>

      <style>{`
        .na-social-link:hover { transform: translateY(-4px); }
        .na-social-link:hover .na-social-box { border-color: var(--accent); box-shadow: 0 3px 10px #00000022; }
        .na-social-videos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 768px) { .na-social-videos-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .na-social-videos-grid { grid-template-columns: repeat(1, 1fr); } }
      `}</style>
    </SectionShell>
  )
}
