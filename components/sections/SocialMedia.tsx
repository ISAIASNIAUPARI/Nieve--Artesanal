'use client'

import type { SocialMediaSection } from '@/lib/types'
import { safeHref } from '@/lib/types'
import CloudinaryVideo from '../editable/CloudinaryVideo'
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

/** Mismo estilo estructural que el campo "Destino" de ButtonsEditor (label
 * arriba, input con borde, ancho completo) — en versión clara, porque acá el
 * campo vive dentro de la sección (fondo claro), no en un panel flotante
 * oscuro como el de los botones. El borde usa un gris neutro fijo en vez de
 * var(--line) — ese token puede salir casi invisible según los 3 colores que
 * elija el cliente, y el campo tiene que leerse como un input sí o sí. */
const linkLabel: React.CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 10,
  color: 'var(--ink-soft)',
  fontFamily: 'system-ui, sans-serif',
}
const linkInput: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 2,
  padding: '7px 9px',
  borderRadius: 6,
  border: '1px solid #00000033',
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
 * Los videos usan CloudinaryVideo (mismo componente/patrón que las fotos de
 * PhotoGallery, pero para video) — en edición, clic o arrastrar-y-soltar
 * sube un archivo nuevo con el mismo "🎬 Cambiar video" que ya usa
 * VideoSection.tsx para el video del hero. En el sitio público solo se ve el
 * <video> con sus controles nativos — nunca la URL como texto.
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
          <div key={network} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 160 }}>
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
              <label style={{ width: '100%' }}>
                <span style={linkLabel}>URL de {LOGOS[network].label}</span>
                <input
                  type="text"
                  value={data.links?.[network] || ''}
                  onChange={(e) => updateLink(network, e.target.value)}
                  placeholder="https://…"
                  style={linkInput}
                />
              </label>
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
          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', background: '#000', aspectRatio: '9/16' }}>
            <CloudinaryVideo
              src={src}
              edit={edit}
              onUploaded={(url) => updateVideo(i, url)}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
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
