import type { SiteSettingsData } from '@/sanity/lib/types'

export default function Footer({ siteSettings }: { siteSettings?: SiteSettingsData }) {
  const brandName = siteSettings?.brandName || 'Nieve Artesanal'
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        padding: '32px 6vw',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--bg)',
        borderTop: '1px solid var(--line)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 18, color: 'var(--ink)' }}>{brandName}</div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>
        © {year} {brandName}
        {siteSettings?.footerNote ? `. ${siteSettings.footerNote}` : ''}
      </p>
    </footer>
  )
}
