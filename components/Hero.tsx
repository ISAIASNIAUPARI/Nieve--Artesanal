import { urlFor } from '@/sanity/lib/image'
import type { HeroSectionData } from '@/sanity/lib/types'

export default function Hero({ data }: { data?: HeroSectionData }) {
  if (!data) return null
  const bgUrl = data.backgroundImage?.asset ? urlFor(data.backgroundImage as any).width(1920).url() : undefined
  const showSecondary = Boolean(data.secondaryButtonText && data.secondaryButtonLink)

  return (
    <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
      {bgUrl && (
        <img
          src={bgUrl}
          alt={data.backgroundImage?.alt || ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, oklch(27% 0.035 45 / 0.867) 0%, oklch(27% 0.035 45 / 0.533) 45%, oklch(27% 0.035 45 / 0.133) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, padding: '0 6vw', maxWidth: 640, animation: 'fadeUp .8s ease' }}>
        {data.badgeText && (
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              border: '1px solid #ffffff55',
              borderRadius: 999,
              color: '#fff',
              fontSize: 13,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            {data.badgeText}
          </span>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: 'clamp(38px, 5.5vw, 68px)',
            lineHeight: 1.05,
            color: '#fff',
            margin: '0 0 20px',
          }}
        >
          {data.heading}
        </h1>
        {data.description && (
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#f2ede6', margin: '0 0 32px', maxWidth: 480 }}>{data.description}</p>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {data.primaryButtonText && data.primaryButtonLink && (
            <a
              href={data.primaryButtonLink}
              style={{
                padding: '14px 30px',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {data.primaryButtonText}
            </a>
          )}
          {showSecondary && (
            <a
              href={data.secondaryButtonLink}
              style={{
                padding: '14px 30px',
                background: 'transparent',
                border: '1px solid #fff',
                color: '#fff',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {data.secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
