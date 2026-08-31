'use client'

import type { SiteSettingsData } from '@/lib/types'
import EditableText from './editable/EditableText'

interface HeaderProps {
  siteSettings?: SiteSettingsData
  edit?: boolean
  onChange?: (field: keyof SiteSettingsData, value: string) => void
}

export default function Header({ siteSettings, edit, onChange }: HeaderProps) {
  const brandName = siteSettings?.brandName || 'Nieve Artesanal'

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
      <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <a href="#nosotros" onClick={(e) => edit && e.preventDefault()} style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>
          Nosotros
        </a>
        <a href="#sabores" onClick={(e) => edit && e.preventDefault()} style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>
          Sabores
        </a>
        <a href="#video" onClick={(e) => edit && e.preventDefault()} style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>
          Cómo lo hacemos
        </a>
        <a href="#ubicacion" onClick={(e) => edit && e.preventDefault()} style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>
          Ubicación
        </a>
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
