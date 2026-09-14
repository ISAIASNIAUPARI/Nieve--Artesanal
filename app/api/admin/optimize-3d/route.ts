import { NextResponse } from 'next/server'
import { del, head } from '@vercel/blob'
import { isAdminRequest } from '@/lib/auth'
import { uploadBufferToCloudinary } from '@/lib/cloudinary'
import { optimizeGlb } from '@/lib/glbOptimize'

// @gltf-transform y sharp necesitan el runtime Node (no Edge).
export const runtime = 'nodejs'
// La optimización (weld/dedup/prune/textureCompress) puede tardar más que una
// firma simple — margen generoso para modelos grandes.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

/**
 * Segundo paso del flujo de subida del modelo 3D: el .glb crudo ya está en
 * Vercel Blob (subido directo navegador→Blob por /upload-3d-token, sin pasar
 * por nuestro servidor ni tener el tope de tamaño de Cloudinary). Acá el
 * SERVIDOR lo descarga por su URL — un fetch saliente no tiene el límite de
 * ~4.5 MB del body de una petición entrante a una función serverless de
 * Vercel — lo optimiza con el mismo pipeline de gltf-transform de siempre,
 * sube la versión final a Cloudinary (sin cambios ahí), y borra el temporal
 * de Vercel Blob.
 *
 * Si algo falla acá (leer el temporal, o subir el resultado optimizado), el
 * temporal NO se borra — el frontend puede reintentar solo este paso sin
 * tener que volver a subir el archivo completo.
 */
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let body: { blobUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const blobUrl = String(body.blobUrl || '')

  // head() solo puede resolver blobs que vivan en NUESTRO store (el que
  // corresponde a BLOB_READ_WRITE_TOKEN) — un admin ya autenticado no gana
  // nada intentando pasar una URL ajena, pero igual se valida el prefijo
  // esperado como defensa adicional.
  let blob: Awaited<ReturnType<typeof head>>
  try {
    blob = await head(blobUrl)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'No se encontró el archivo subido. Puede que ya haya expirado — sube el .glb de nuevo.' },
      { status: 400 }
    )
  }
  if (!blob.pathname.startsWith('raw-tmp/') || !blob.pathname.toLowerCase().endsWith('.glb')) {
    return NextResponse.json({ ok: false, error: 'Archivo inválido.' }, { status: 400 })
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'El archivo subido supera el límite permitido.' }, { status: 400 })
  }

  let original: Buffer
  try {
    const res = await fetch(blob.url)
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `No se pudo leer el archivo subido (${res.status}).`, retryBlobUrl: blobUrl },
        { status: 502 }
      )
    }
    original = Buffer.from(await res.arrayBuffer())
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Error al leer el archivo subido.', retryBlobUrl: blobUrl },
      { status: 500 }
    )
  }

  const { buffer: optimizedBuffer, optimized } = await optimizeGlb(original)

  const finalPublicId = `producto-${Date.now()}.glb`

  try {
    const result = await uploadBufferToCloudinary(optimizedBuffer, { resourceType: 'raw', publicId: finalPublicId })
    // El temporal ya cumplió su función — si el borrado falla no es grave
    // (solo ocupa espacio), así que no bloquea la respuesta de éxito.
    del(blobUrl).catch((err) => console.error('[optimize-3d] no se pudo borrar el temporal de Blob:', err))
    return NextResponse.json({ ok: true, glbUrl: result.secure_url, optimized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al subir a Cloudinary.'
    return NextResponse.json({ ok: false, error: message, retryBlobUrl: blobUrl }, { status: 500 })
  }
}
