import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { CLOUDINARY_FOLDER, deleteFromCloudinary, getCloudinaryConfig, uploadBufferToCloudinary } from '@/lib/cloudinary'
import { optimizeGlb } from '@/lib/glbOptimize'

// @gltf-transform y sharp necesitan el runtime Node (no Edge).
export const runtime = 'nodejs'
// La optimización (weld/dedup/prune/textureCompress) puede tardar más que una
// firma simple — margen generoso para modelos grandes.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

// Debe calzar exacto con el public_id que genera /api/admin/upload-3d-sign.
// El .glb crudo ya vive en Cloudinary bajo control de un admin autenticado,
// pero igual no hay motivo para que esta ruta acepte descargar/procesar
// cualquier otro recurso del mismo Cloudinary — solo el temporal esperado.
const RAW_TMP_PATTERN = /^raw-tmp-\d+\.glb$/

/**
 * Segundo paso del flujo de subida del modelo 3D: el .glb crudo ya está en
 * Cloudinary (subido directo navegador→Cloudinary por /upload-3d-sign, sin
 * pasar por nuestro servidor). Acá el SERVIDOR lo descarga por su URL —
 * un fetch saliente no tiene el límite de ~4.5 MB que sí tiene el body de
 * una petición entrante a una función serverless de Vercel — lo optimiza
 * con el mismo pipeline de gltf-transform de siempre, sube la versión final,
 * y borra el temporal.
 *
 * Si algo falla acá (leer el temporal, o subir el resultado optimizado), el
 * temporal NO se borra — el frontend puede reintentar solo este paso sin
 * tener que volver a subir el archivo completo.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { publicId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const publicId = String(body.publicId || '')
  if (!RAW_TMP_PATTERN.test(publicId)) {
    return NextResponse.json({ ok: false, error: 'Identificador de archivo inválido.' }, { status: 400 })
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

  const fullPublicId = `${CLOUDINARY_FOLDER}/${publicId}`
  const rawUrl = `https://res.cloudinary.com/${config.cloudName}/raw/upload/${fullPublicId}`

  let original: Buffer
  try {
    const res = await fetch(rawUrl)
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `No se pudo leer el archivo subido (${res.status}).`, retryPublicId: publicId },
        { status: 502 }
      )
    }
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'El archivo subido supera el límite permitido.' }, { status: 400 })
    }
    original = Buffer.from(arrayBuffer)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Error al leer el archivo subido.', retryPublicId: publicId },
      { status: 500 }
    )
  }

  const { buffer: optimizedBuffer, optimized } = await optimizeGlb(original)

  const finalPublicId = `producto-${Date.now()}.glb`

  try {
    const result = await uploadBufferToCloudinary(optimizedBuffer, { resourceType: 'raw', publicId: finalPublicId })
    // El temporal ya cumplió su función — si el borrado falla no es grave
    // (solo ocupa espacio), así que no bloquea la respuesta de éxito.
    deleteFromCloudinary(fullPublicId, 'raw').catch((err) =>
      console.error('[optimize-3d] no se pudo borrar el temporal:', err)
    )
    return NextResponse.json({ ok: true, glbUrl: result.secure_url, optimized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al subir a Cloudinary.'
    return NextResponse.json({ ok: false, error: message, retryPublicId: publicId }, { status: 500 })
  }
}
