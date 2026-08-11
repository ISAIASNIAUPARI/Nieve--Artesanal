import { urlFor } from '@/sanity/lib/image'
import type { FlavorsSectionData, SanityImageValue } from '@/sanity/lib/types'

function Tile({
  image,
  caption,
  alt,
  style,
}: {
  image?: SanityImageValue
  caption?: string
  alt?: string
  style: React.CSSProperties
}) {
  if (!image?.asset) return null
  const url = urlFor(image as any).width(1000).url()
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', ...style }}>
      <img src={url} alt={alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {caption && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, background: 'linear-gradient(0deg, #000000aa, transparent)' }}>
          <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{caption}</p>
        </div>
      )}
    </div>
  )
}

export default function Flavors({ data }: { data?: FlavorsSectionData }) {
  if (!data) return null

  return (
    <section id="sabores" style={{ padding: '20px 6vw 100px' }}>
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: 'auto auto', gap: 20 }}>
        <Tile
          image={data.featuredImage}
          caption={data.featuredImageCaption}
          alt={data.featuredImage?.alt}
          style={{ gridRow: 'span 2' }}
        />
        <Tile
          image={data.secondaryImage1}
          caption={data.secondaryImage1Caption}
          alt={data.secondaryImage1?.alt}
          style={{ aspectRatio: '4/3' }}
        />
        <Tile
          image={data.secondaryImage2}
          caption={data.secondaryImage2Caption}
          alt={data.secondaryImage2?.alt}
          style={{ aspectRatio: '4/3' }}
        />
      </div>
      {data.bannerImage?.asset && (
        <div style={{ marginTop: 20 }}>
          <Tile image={data.bannerImage} caption={data.bannerImageCaption} alt={data.bannerImage?.alt} style={{ aspectRatio: '21/7' }} />
        </div>
      )}
    </section>
  )
}
