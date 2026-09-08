import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { CLOUDINARY_FOLDER, getCloudinaryConfig, signUploadParams } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_BYTES = 200 * 1024 * 1024 // 200 MB

/**
 * Firma una subida directa navegador → Cloudinary para un video.
 *
 * Igual que /upload-image pero con resource_type "video". La subida directa es
 * imprescindible aquí: 200 MB jamás pasarían por una función serverless de Vercel.
 * El navegador sube con XHR y va reportando el progreso.
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
    return NextResponse.json({ ok: false, error: 'Formato no permitido. Usa MP4, MOV o WebM.' }, { status: 400 })
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'El video no puede superar los 200 MB.' }, { status: 400 })
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
    resourceType: 'video',
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: CLOUDINARY_FOLDER,
    timestamp,
    signature,
  })
}
