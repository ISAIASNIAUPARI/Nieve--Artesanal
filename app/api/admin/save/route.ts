import { NextResponse } from 'next/server'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { commitFiles, type FileChange } from '@/lib/github'
import { CONTENT_FILES } from '@/lib/types'

const ALLOWED_CONTENT_PATHS = new Set(Object.values(CONTENT_FILES).map((f) => `content/${f}`))

export async function POST(req: Request) {
  const token = req.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.split('=')[1]

  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { sections?: { path: string; json: unknown }[]; images?: { path: string; base64: string }[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const sections = body.sections ?? []
  const images = body.images ?? []

  for (const s of sections) {
    if (!ALLOWED_CONTENT_PATHS.has(s.path)) {
      return NextResponse.json({ ok: false, error: `Ruta de contenido no permitida: ${s.path}` }, { status: 400 })
    }
  }
  for (const img of images) {
    if (!img.path.startsWith('public/images/uploads/')) {
      return NextResponse.json({ ok: false, error: `Ruta de imagen no permitida: ${img.path}` }, { status: 400 })
    }
  }

  if (sections.length === 0 && images.length === 0) {
    return NextResponse.json({ ok: false, error: 'No hay cambios que guardar.' }, { status: 400 })
  }

  const files: FileChange[] = [
    ...sections.map((s) => ({ path: s.path, content: JSON.stringify(s.json, null, 2) + '\n', encoding: 'utf-8' as const })),
    ...images.map((img) => ({ path: img.path, content: img.base64, encoding: 'base64' as const })),
  ]

  try {
    const result = await commitFiles(files, `Editar contenido desde /admin — ${new Date().toISOString()}`)
    return NextResponse.json({ ok: true, sha: result.sha, htmlUrl: result.htmlUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al guardar en GitHub.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
