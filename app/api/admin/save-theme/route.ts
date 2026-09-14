import { NextResponse } from 'next/server'
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { commitFiles } from '@/lib/github'
import { THEME_FILE, isValidHexColor, type Theme } from '@/lib/types'

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

  let body: Partial<Theme>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const { colorPrimary, colorSecondary, colorAccent } = body
  if (!isValidHexColor(colorPrimary) || !isValidHexColor(colorSecondary) || !isValidHexColor(colorAccent)) {
    return NextResponse.json({ ok: false, error: 'Cada color debe ser un hex válido, ej. #e05d3d.' }, { status: 400 })
  }

  const theme: Theme = { colorPrimary, colorSecondary, colorAccent }

  try {
    const result = await commitFiles(
      [{ path: `content/${THEME_FILE}`, content: JSON.stringify(theme, null, 2) + '\n', encoding: 'utf-8' }],
      `Personalizar tema desde /admin — ${new Date().toISOString()}`
    )
    return NextResponse.json({ ok: true, sha: result.sha, htmlUrl: result.htmlUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al guardar en GitHub.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
