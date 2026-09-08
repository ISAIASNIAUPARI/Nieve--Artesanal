export interface ImageValue {
  src: string
  alt?: string
}

export interface VideoValue {
  src?: string
}

/** Tipo de destino de un botón — determina cómo se construye el href final. */
export type HrefType = 'anchor' | 'url' | 'whatsapp' | 'phone'

export interface Button {
  id: string
  text: string
  href: string
  hrefType: HrefType
}

export const MAX_BUTTONS = 5

/** Anclas de sección disponibles para los botones tipo "Misma página". */
export const PAGE_ANCHORS: { value: string; label: string }[] = [
  { value: '#inicio', label: 'Portada' },
  { value: '#nosotros', label: 'Nosotros' },
  { value: '#sabores', label: 'Sabores' },
  { value: '#video', label: 'Video' },
  { value: '#ubicacion', label: 'Ubicación' },
  { value: '#contacto', label: 'Contacto' },
]

/** Estado de una subida de medio en curso desde el /admin (para la barra de progreso). */
export interface MediaUploadStatus {
  pct: number
  error: string | null
}

/**
 * Un href es seguro si no arranca un esquema peligroso (javascript:, data:, vbscript:).
 * Se usa tanto al validar en el /admin como al renderizar el sitio público.
 */
export function isSafeHref(href: string | undefined | null): boolean {
  if (!href) return true
  return !/^\s*(javascript|data|vbscript):/i.test(href)
}

/** Devuelve el href si es seguro; si no, '#'. */
export function safeHref(href: string | undefined | null): string {
  return href && isSafeHref(href) ? href : '#'
}

/** Solo dígitos (para WhatsApp / teléfono). */
function digitsOnly(value: string): string {
  return (value || '').replace(/[^\d]/g, '')
}

/**
 * Construye el href final de un botón a partir de su tipo:
 * - anchor / url → el valor tal cual
 * - whatsapp     → https://wa.me/<dígitos>
 * - phone        → tel:+<dígitos>
 */
export function resolveButtonHref(button: Pick<Button, 'href' | 'hrefType'>): string {
  const raw = (button.href || '').trim()
  switch (button.hrefType) {
    case 'whatsapp': {
      const n = digitsOnly(raw)
      return n ? `https://wa.me/${n}` : '#'
    }
    case 'phone': {
      const n = digitsOnly(raw)
      return n ? `tel:+${n}` : '#'
    }
    default:
      return safeHref(raw)
  }
}

/** Valida un array de botones antes de guardar. Devuelve un mensaje de error o null. */
export function validateButtons(buttons: Button[] | undefined, sectionLabel: string): string | null {
  if (!buttons || buttons.length === 0) return null
  if (buttons.length > MAX_BUTTONS) {
    return `${sectionLabel}: máximo ${MAX_BUTTONS} botones por sección.`
  }
  for (const b of buttons) {
    if (!b.text?.trim()) return `${sectionLabel}: hay un botón sin texto.`
    if (!b.href?.trim()) return `${sectionLabel}: el botón "${b.text}" no tiene destino.`
    if (!isSafeHref(b.href)) return `${sectionLabel}: el destino del botón "${b.text}" no está permitido.`
  }
  return null
}

export interface SiteSettingsData {
  brandName?: string
  footerNote?: string
}

export interface HeroSectionData {
  badgeText?: string
  heading?: string
  description?: string
  buttons?: Button[]
  backgroundImage?: ImageValue
}

export interface AboutSectionData {
  eyebrow?: string
  heading?: string
  paragraph1?: string
  paragraph2?: string
  image?: ImageValue
  buttons?: Button[]
}

export interface FlavorsSectionData {
  eyebrow?: string
  heading?: string
  featuredImage?: ImageValue
  featuredImageCaption?: string
  secondaryImage1?: ImageValue
  secondaryImage1Caption?: string
  secondaryImage2?: ImageValue
  secondaryImage2Caption?: string
  bannerImage?: ImageValue
  bannerImageCaption?: string
  buttons?: Button[]
}

export interface VideoSectionData {
  eyebrow?: string
  heading?: string
  video?: VideoValue
  buttons?: Button[]
}

export interface LocationSectionData {
  eyebrow?: string
  heading?: string
  address?: string
  schedule?: string
  phone?: string
  confirmationMessage?: string
  buttons?: Button[]
}

export interface HomePageData {
  siteSettings: SiteSettingsData
  hero: HeroSectionData
  about: AboutSectionData
  flavors: FlavorsSectionData
  video: VideoSectionData
  location: LocationSectionData
}

/** Nombre de archivo (dentro de /content) por sección — usado por el admin y por el commit a GitHub. */
export const CONTENT_FILES = {
  siteSettings: 'settings.json',
  hero: 'hero.json',
  about: 'about.json',
  flavors: 'flavors.json',
  video: 'video.json',
  location: 'location.json',
} as const

export type SectionKey = keyof typeof CONTENT_FILES

export const SECTION_LABELS: Record<SectionKey, string> = {
  siteSettings: 'Ajustes',
  hero: 'Portada',
  about: 'Nosotros',
  flavors: 'Sabores',
  video: 'Video',
  location: 'Ubicación',
}

/** Secciones que tienen barra de botones editable desde el /admin. */
export const BUTTON_SECTIONS: SectionKey[] = ['hero', 'about', 'flavors', 'video', 'location']

/** Crea un botón nuevo con id único. */
export function newButton(): Button {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `btn-${Date.now().toString(36)}`
  return { id, text: 'Botón nuevo', href: '#inicio', hrefType: 'anchor' }
}
