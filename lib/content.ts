import fs from 'node:fs'
import path from 'node:path'
import {
  CONTENT_FILES,
  DEFAULT_PAGE_LAYOUT,
  PAGE_LAYOUT_FILE,
  normalizePageLayout,
  templateTypeOf,
  type DynamicSectionData,
  type HomePageData,
  type PageLayout,
  type SectionKey,
} from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const SECTIONS_DIR = path.join(CONTENT_DIR, 'sections')

function readJson<T>(filename: string): T {
  const filePath = path.join(CONTENT_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function readJsonSafe<T>(filename: string, fallback: T): T {
  try {
    return readJson<T>(filename)
  } catch {
    return fallback
  }
}

export function getSection<T>(key: SectionKey): T {
  return readJson<T>(CONTENT_FILES[key])
}

/** Lee las 6 secciones del contenido directamente de /content — esto reemplaza la consulta a Sanity. */
export function getHomePageData(): HomePageData {
  return {
    siteSettings: readJson(CONTENT_FILES.siteSettings),
    hero: readJson(CONTENT_FILES.hero),
    about: readJson(CONTENT_FILES.about),
    flavors: readJson(CONTENT_FILES.flavors),
    video: readJson(CONTENT_FILES.video),
    location: readJson(CONTENT_FILES.location),
  }
}

/** Orden y visibilidad de las secciones de la página (content/pageLayout.json). */
export function getPageLayout(): PageLayout {
  return normalizePageLayout(readJsonSafe(PAGE_LAYOUT_FILE, DEFAULT_PAGE_LAYOUT))
}

const DYNAMIC_ID = /^[a-z0-9-]+$/

/** Lee una sección dinámica (content/sections/<id>.json). Devuelve null si no existe o el tipo no es válido. */
export function getDynamicSection(id: string): DynamicSectionData | null {
  if (!DYNAMIC_ID.test(id)) return null
  let raw: (DynamicSectionData & { type?: string }) | null
  try {
    raw = JSON.parse(fs.readFileSync(path.join(SECTIONS_DIR, `${id}.json`), 'utf-8'))
  } catch {
    return null
  }
  const type = templateTypeOf(id, raw)
  if (!type || !raw) return null
  return { ...raw, type } as DynamicSectionData
}

/** Todas las secciones dinámicas, por id (para el /admin). */
export function getAllDynamicSections(): Record<string, DynamicSectionData> {
  let files: string[]
  try {
    files = fs.readdirSync(SECTIONS_DIR)
  } catch {
    return {}
  }
  const out: Record<string, DynamicSectionData> = {}
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const id = file.slice(0, -5)
    const section = getDynamicSection(id)
    if (section) out[id] = section
  }
  return out
}
