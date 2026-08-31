'use client'

import type { SiteSettingsData } from '@/lib/types'
import EditableText from './editable/EditableText'

interface FooterProps {
  siteSettings?: SiteSettingsData
  edit?: boolean
  onChange?: (field: keyof SiteSettingsData, value: string) => void
}

export default function Footer({ siteSettings, edit, onChange }: FooterProps) {
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
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', display: 'flex', gap: 4, alignItems: 'baseline' }}>
        <span>
          © {year} {brandName}
          {!edit && siteSettings?.footerNote ? '.' : ''}
        </span>
        {(edit || siteSettings?.footerNote) && (
          <EditableText
            edit={edit}
            value={siteSettings?.footerNote}
            onChange={(v) => onChange?.('footerNote', v)}
            placeholder="Nota del pie de página"
          />
        )}
      </p>
    </footer>
  )
}
