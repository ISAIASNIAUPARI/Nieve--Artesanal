import { urlFor } from '@/sanity/lib/image'
import type { AboutSectionData } from '@/sanity/lib/types'

export default function About({ data }: { data?: AboutSectionData }) {
  if (!data) return null
  const imgUrl = data.image?.asset ? urlFor(data.image as any).width(1200).url() : undefined

  return (
    <section
      id="nosotros"
      style={{
        padding: '100px 6vw',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
        alignItems: 'center',
      }}
    >
      <div>
        {data.eyebrow && (
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {data.eyebrow}
          </span>
        )}
        <h2
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(28px,3.5vw,42px)',
            margin: '12px 0 20px',
            color: 'var(--ink)',
          }}
        >
          {data.heading}
        </h2>
        {data.paragraph1 && (
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: '0 0 18px' }}>{data.paragraph1}</p>
        )}
        {data.paragraph2 && <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0 }}>{data.paragraph2}</p>}
      </div>
      {imgUrl && (
        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '4/3' }}>
          <img src={imgUrl} alt={data.image?.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </section>
  )
}
