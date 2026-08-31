import fs from 'node:fs'
import path from 'node:path'
import { CONTENT_FILES, type HomePageData, type SectionKey } from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function readJson<T>(filename: string): T {
  const filePath = path.join(CONTENT_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
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
