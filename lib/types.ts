export interface ImageValue {
  src: string
  alt?: string
}

export interface VideoValue {
  src?: string
}

export interface ButtonValue {
  text?: string
  href?: string
}

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

export interface SiteSettingsData {
  brandName?: string
  footerNote?: string
}

export interface HeroSectionData {
  badgeText?: string
  heading?: string
  description?: string
  primaryButton?: ButtonValue
  secondaryButton?: ButtonValue
  backgroundImage?: ImageValue
}

export interface AboutSectionData {
  eyebrow?: string
  heading?: string
  paragraph1?: string
  paragraph2?: string
  image?: ImageValue
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
}

export interface VideoSectionData {
  eyebrow?: string
  heading?: string
  video?: VideoValue
}

export interface LocationSectionData {
  eyebrow?: string
  heading?: string
  address?: string
  schedule?: string
  phone?: string
  confirmationMessage?: string
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
