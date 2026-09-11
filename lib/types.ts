export interface ImageValue {
  src: string
  alt?: string
  /** Punto focal en % (0-100) usado como object-position al recortar con object-fit:cover. */
  focalX?: number
  focalY?: number
}

/** object-position para un ImageValue — 50% 50% (centro) si no tiene punto focal guardado. */
export function focalPosition(img?: { focalX?: number; focalY?: number } | null): string {
  return `${img?.focalX ?? 50}% ${img?.focalY ?? 50}%`
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

/**
 * Anclas de sección disponibles para los botones tipo "Misma página".
 * El id de cada sección (en pageLayout.json y en el <section id=...>) es el mismo
 * que aquí sin la almohadilla — así los botones siguen apuntando bien aunque el
 * cliente reordene las secciones.
 */
export const PAGE_ANCHORS: { value: string; label: string }[] = [
  { value: '#hero', label: 'Portada' },
  { value: '#about', label: 'Nosotros' },
  { value: '#flavors', label: 'Sabores' },
  { value: '#video', label: 'Video' },
  { value: '#location', label: 'Ubicación' },
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
export function validateButtons(
  buttons: Button[] | undefined,
  sectionLabel: string,
  max: number = MAX_BUTTONS
): string | null {
  if (!buttons || buttons.length === 0) return null
  if (buttons.length > max) {
    return `${sectionLabel}: máximo ${max} ${max === 1 ? 'botón' : 'botones'}.`
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
  return { id, text: 'Botón nuevo', href: '#hero', hrefType: 'anchor' }
}

// ─── Distribución de la página (orden y visibilidad de secciones) ──────────────

/** Ids de las secciones base del sitio, en su orden natural. */
export const BASE_SECTION_IDS = ['hero', 'about', 'flavors', 'video', 'location'] as const
export type BaseSectionId = (typeof BASE_SECTION_IDS)[number]

/** Mapea el id de sección base a su clave de contenido (para leer el JSON correcto). */
export const BASE_SECTION_TO_KEY: Record<BaseSectionId, SectionKey> = {
  hero: 'hero',
  about: 'about',
  flavors: 'flavors',
  video: 'video',
  location: 'location',
}

export function isBaseSectionId(id: string): id is BaseSectionId {
  return (BASE_SECTION_IDS as readonly string[]).includes(id)
}

export interface LayoutSection {
  id: string
  label: string
  visible: boolean
}

export interface PageLayout {
  sections: LayoutSection[]
}

export const PAGE_LAYOUT_FILE = 'pageLayout.json'

/** Distribución por defecto si aún no existe content/pageLayout.json. */
export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  sections: [
    { id: 'hero', label: 'Portada', visible: true },
    { id: 'about', label: 'Nosotros', visible: true },
    { id: 'flavors', label: 'Sabores', visible: true },
    { id: 'video', label: 'Video', visible: true },
    { id: 'location', label: 'Ubicación', visible: true },
  ],
}

/**
 * Normaliza una distribución leída de disco: conserva el orden guardado, añade al
 * final cualquier sección base que falte, y descarta entradas sin id.
 */
export function normalizePageLayout(raw: Partial<PageLayout> | null | undefined): PageLayout {
  const seen = new Set<string>()
  const sections: LayoutSection[] = []
  for (const s of raw?.sections ?? []) {
    if (!s || typeof s.id !== 'string' || seen.has(s.id)) continue
    seen.add(s.id)
    sections.push({ id: s.id, label: s.label || s.id, visible: s.visible !== false })
  }
  for (const base of DEFAULT_PAGE_LAYOUT.sections) {
    if (!seen.has(base.id)) sections.push({ ...base })
  }
  return { sections }
}

// ─── Secciones nuevas desde plantilla ─────────────────────────────────────────

export const SECTION_TEMPLATES = [
  { type: 'cta-banner', label: 'Llamada a la acción', desc: 'Título, texto y hasta 2 botones', icon: '📣' },
  { type: 'menu-grid', label: 'Carta / Menú', desc: 'Tarjetas con foto, nombre, precio y descripción', icon: '🍨' },
  { type: 'text-block', label: 'Bloque de texto', desc: 'Un título y varios párrafos', icon: '📝' },
  { type: 'photo-gallery', label: 'Galería de fotos', desc: 'Fotos con pie de imagen', icon: '🖼️' },
  { type: 'faq', label: 'Preguntas frecuentes', desc: 'Lista de pregunta y respuesta', icon: '❓' },
] as const

export type SectionTemplateType = (typeof SECTION_TEMPLATES)[number]['type']

export const TEMPLATE_TYPES: SectionTemplateType[] = SECTION_TEMPLATES.map((t) => t.type)

export function isTemplateType(t: string): t is SectionTemplateType {
  return (TEMPLATE_TYPES as string[]).includes(t)
}

export interface MenuCard {
  id: string
  image: ImageValue
  name: string
  price: string
  description: string
}
export interface GalleryPhoto {
  id: string
  image: ImageValue
  caption: string
}
export interface TextParagraph {
  id: string
  text: string
}
export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface CtaBannerData {
  type: 'cta-banner'
  heading: string
  description: string
  buttons: Button[]
  /** Fondo opcional detrás del texto (16:9). */
  image?: ImageValue
}
export interface MenuGridData {
  type: 'menu-grid'
  heading: string
  items: MenuCard[]
}
export interface TextBlockData {
  type: 'text-block'
  heading: string
  paragraphs: TextParagraph[]
  /** Imagen opcional sobre el texto (3:2). */
  image?: ImageValue
}
export interface PhotoGalleryData {
  type: 'photo-gallery'
  heading: string
  images: GalleryPhoto[]
}
export interface FaqData {
  type: 'faq'
  heading: string
  items: FaqItem[]
}

export type DynamicSectionData = CtaBannerData | MenuGridData | TextBlockData | PhotoGalleryData | FaqData

/** id corto y único para tarjetas / fotos / párrafos / preguntas. */
export function newItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `it-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Convierte un nombre libre en un slug apto para id/archivo. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Estructura vacía de una sección según su plantilla. */
export function emptyDynamicSection(type: SectionTemplateType): DynamicSectionData {
  switch (type) {
    case 'cta-banner':
      return { type, heading: '', description: '', buttons: [] }
    case 'menu-grid':
      return { type, heading: '', items: [] }
    case 'text-block':
      return { type, heading: '', paragraphs: [] }
    case 'photo-gallery':
      return { type, heading: '', images: [] }
    case 'faq':
      return { type, heading: '', items: [] }
  }
}

/** Deduce el tipo de plantilla de una sección (por su campo `type`, o por el prefijo del id). */
export function templateTypeOf(id: string, raw?: { type?: string } | null): SectionTemplateType | null {
  if (raw?.type && isTemplateType(raw.type)) return raw.type
  for (const t of TEMPLATE_TYPES) {
    if (id === t || id.startsWith(`${t}-`)) return t
  }
  return null
}
