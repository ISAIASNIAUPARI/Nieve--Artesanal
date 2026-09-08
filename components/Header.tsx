'use client'

import type { LayoutSection, SiteSettingsData } from '@/lib/types'
import { DEFAULT_PAGE_LAYOUT } from '@/lib/types'
import EditableText from './editable/EditableText'

interface HeaderProps {
  siteSettings?: SiteSettingsData
  /** Secciones de la página — el menú se arma con las visibles, en su orden. */
  sections?: LayoutSection[]
  edit?: boolean
  onChange?: (field: keyof SiteSettingsData, value: string) => void
}

export default function Header({ siteSettings, sections, edit, onChange }: HeaderProps) {
  const brandName = siteSettings?.brandName || 'Nieve Artesanal'
  const navSections = (sections ?? DEFAULT_PAGE_LAYOUT.sections).filter((s) => s.visible && s.id !== 'hero')

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 6vw',
        background: 'oklch(97.5% 0.012 80 / 0.933)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <EditableText
        edit={edit}
        value={brandName}
        onChange={(v) => onChange?.('brandName', v)}
        placeholder="Nombre de la marca"
        style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: 24, color: 'var(--ink)' }}
      />
      <nav style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {navSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => edit && e.preventDefault()}
            style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}
          >
            {s.label}
          </a>
        ))}
        <a
          href="#contacto"
          onClick={(e) => edit && e.preventDefault()}
          style={{
            padding: '10px 22px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Contacto
        </a>
      </nav>
    </header>
  )
}
