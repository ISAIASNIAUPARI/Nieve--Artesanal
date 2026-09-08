import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { CLOUDINARY_FOLDER, getCloudinaryConfig, signUploadParams } from '@/lib/cloudinary'

// El SDK de Cloudinary necesita el runtime Node (no Edge).
export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Firma una subida directa navegador → Cloudinary para una imagen.
 *
 * El navegador manda { contentType, bytes }; validamos formato y tamaño aquí y,
 * si todo bien, devolvemos una firma de un solo uso. El archivo va directo del
 * navegador a Cloudinary (así no topa con el límite de ~4.5 MB del cuerpo de
 * las funciones serverless de Vercel, y podemos aceptar hasta 10 MB).
 *
 * CLOUDINARY_API_SECRET nunca sale de esta ruta.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { contentType?: string; bytes?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const contentType = String(body.contentType || '').toLowerCase()
  const bytes = Number(body.bytes || 0)

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { ok: false, error: 'Formato no permitido. Usa JPEG, PNG, WebP o AVIF.' },
      { status: 400 }
    )
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'La imagen no puede superar los 10 MB.' }, { status: 400 })
  }

  let config
  try {
    config = getCloudinaryConfig()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Cloudinary no está configurado.' },
      { status: 500 }
    )
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signUploadParams({ folder: CLOUDINARY_FOLDER, timestamp })

  return NextResponse.json({
    ok: true,
    resourceType: 'image',
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: CLOUDINARY_FOLDER,
    timestamp,
    signature,
  })
}
