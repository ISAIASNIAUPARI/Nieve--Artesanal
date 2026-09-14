import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { CLOUDINARY_FOLDER, getCloudinaryConfig, signUploadParams } from '@/lib/cloudinary'

export const runtime = 'nodejs'
// La firma es distinta en cada petición (timestamp + public_id) — nunca cachear.
export const dynamic = 'force-dynamic'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

/**
 * Firma una subida directa navegador → Cloudinary del .glb SIN optimizar
 * todavía (resource_type "raw"), igual que /upload-image y /upload-video: el
 * archivo nunca pasa por nuestro servidor en este paso, así que no topa con
 * el límite de ~4.5 MB del cuerpo de las funciones serverless de Vercel —
 * antes, con el .glb pasando completo por /api/admin/upload-3d, cualquier
 * archivo de más de ~4 MB fallaba con 413 sin llegar siquiera a nuestro código.
 *
 * El archivo queda con public_id "raw-tmp-<timestamp>.glb". El siguiente paso
 * (/api/admin/optimize-3d) lo descarga desde ahí, lo optimiza con
 * gltf-transform (mismo pipeline de siempre) y sube la versión final — así el
 * .glb sí sigue pasando por el servidor para optimizarse, solo que ya no
 * viaja del navegador al servidor por el body de la petición.
 *
 * CLOUDINARY_API_SECRET nunca sale de esta ruta.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { bytes?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const bytes = Number(body.bytes || 0)
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `El archivo no puede superar los ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 400 }
    )
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
  const publicId = `raw-tmp-${Date.now()}.glb`
  const signature = signUploadParams({ folder: CLOUDINARY_FOLDER, public_id: publicId, timestamp })

  return NextResponse.json({
    ok: true,
    resourceType: 'raw',
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: CLOUDINARY_FOLDER,
    publicId,
    timestamp,
    signature,
  })
}
