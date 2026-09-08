import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { commitFiles, type FileChange } from '@/lib/github'
import {
  BASE_SECTION_IDS,
  emptyDynamicSection,
  isTemplateType,
  slugify,
  type LayoutSection,
} from '@/lib/types'

export const runtime = 'nodejs'

/** Limpia el array de secciones que manda el cliente (para no confiar en él a ciegas). */
function sanitizeLayout(raw: unknown): LayoutSection[] | null {
  if (!Array.isArray(raw)) return null
  const out: LayoutSection[] = []
  const seen = new Set<string>()
  for (const s of raw) {
    if (!s || typeof s.id !== 'string' || !/^[a-z0-9-]+$/.test(s.id) || seen.has(s.id)) return null
    seen.add(s.id)
    out.push({ id: s.id, label: String(s.label || s.id).slice(0, 60), visible: s.visible !== false })
  }
  return out
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { type?: string; label?: string; layout?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const type = String(body.type || '')
  const label = String(body.label || '').trim()

  if (!isTemplateType(type)) {
    return NextResponse.json({ ok: false, error: 'Plantilla desconocida.' }, { status: 400 })
  }
  if (!label) {
    return NextResponse.json({ ok: false, error: 'Ponle un nombre a la sección.' }, { status: 400 })
  }

  const slug = slugify(label)
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Ese nombre no genera un identificador válido, prueba con otro.' }, { status: 400 })
  }
  const id = `${type}-${slug}`

  if ((BASE_SECTION_IDS as readonly string[]).includes(id)) {
    return NextResponse.json({ ok: false, error: 'Ese nombre choca con una sección base.' }, { status: 400 })
  }

  const layout = sanitizeLayout(body.layout)
  if (!layout) {
    return NextResponse.json({ ok: false, error: 'La distribución de la página no es válida.' }, { status: 400 })
  }
  if (layout.some((s) => s.id === id)) {
    return NextResponse.json({ ok: false, error: 'Ya existe una sección con ese nombre.' }, { status: 409 })
  }

  const content = emptyDynamicSection(type)
  const newLayout: LayoutSection[] = [...layout, { id, label, visible: true }]

  const files: FileChange[] = [
    { path: 'content/pageLayout.json', content: JSON.stringify({ sections: newLayout }, null, 2) + '\n', encoding: 'utf-8' },
    { path: `content/sections/${id}.json`, content: JSON.stringify(content, null, 2) + '\n', encoding: 'utf-8' },
  ]

  try {
    const result = await commitFiles(files, `crear sección ${label}`)
    return NextResponse.json({ ok: true, id, layout: newLayout, content, sha: result.sha, htmlUrl: result.htmlUrl })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'No se pudo crear la sección.' },
      { status: 500 }
    )
  }
}
