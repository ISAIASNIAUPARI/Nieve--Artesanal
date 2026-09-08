import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { commitFiles, type FileChange } from '@/lib/github'
import { BASE_SECTION_IDS, templateTypeOf, type LayoutSection } from '@/lib/types'

export const runtime = 'nodejs'

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

  let body: { id?: string; label?: string; layout?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const id = String(body.id || '')
  const label = String(body.label || id).trim()

  if (!/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: 'Id de sección inválido.' }, { status: 400 })
  }
  if ((BASE_SECTION_IDS as readonly string[]).includes(id)) {
    return NextResponse.json({ ok: false, error: 'No se pueden eliminar las secciones base del sitio.' }, { status: 403 })
  }
  if (!templateTypeOf(id)) {
    return NextResponse.json({ ok: false, error: 'Esa sección no es una sección de plantilla.' }, { status: 400 })
  }

  const layout = sanitizeLayout(body.layout)
  if (!layout) {
    return NextResponse.json({ ok: false, error: 'La distribución de la página no es válida.' }, { status: 400 })
  }

  const newLayout = layout.filter((s) => s.id !== id)

  const files: FileChange[] = [
    { path: 'content/pageLayout.json', content: JSON.stringify({ sections: newLayout }, null, 2) + '\n', encoding: 'utf-8' },
    { path: `content/sections/${id}.json`, remove: true },
  ]

  try {
    const result = await commitFiles(files, `eliminar sección ${label}`)
    return NextResponse.json({ ok: true, layout: newLayout, sha: result.sha, htmlUrl: result.htmlUrl })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'No se pudo eliminar la sección.' },
      { status: 500 }
    )
  }
}
