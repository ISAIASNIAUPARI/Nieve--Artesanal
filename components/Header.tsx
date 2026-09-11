'use client'

import type { LayoutSection, SiteSettingsData } from '@/lib/types'
import { DEFAULT_PAGE_LAYOUT } from '@/lib/types'
import EditableText from './editable/EditableText'
import { useIsMobileView } from './useIsMobileView'

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
  const isMobile = useIsMobileView()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: 8,
        padding: isMobile ? '14px 20px' : '18px 6vw',
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
        style={{
          flexShrink: 0,
          fontFamily: 'var(--font-dm-serif), serif',
          fontSize: isMobile ? 19 : 24,
          color: 'var(--ink)',
        }}
      />
      <nav
        style={{
          display: 'flex',
          gap: isMobile ? 14 : 32,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {navSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => edit && e.preventDefault()}
            style={{ color: 'var(--ink)', fontSize: isMobile ? 13 : 15, fontWeight: 500 }}
          >
            {s.label}
          </a>
        ))}
        <a
          href="#contacto"
          onClick={(e) => edit && e.preventDefault()}
          style={{
            padding: isMobile ? '8px 16px' : '10px 22px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 999,
            fontSize: isMobile ? 13 : 14,
            fontWeight: 600,
          }}
        >
          Contacto
        </a>
      </nav>
    </header>
  )
}
