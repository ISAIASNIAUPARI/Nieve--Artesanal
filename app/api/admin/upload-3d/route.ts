import { NextResponse } from 'next/server'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import draco3d from 'draco3dgltf'
import { isAdminRequest } from '@/lib/auth'
import { uploadBufferToCloudinary } from '@/lib/cloudinary'

// @gltf-transform, sharp y el SDK de Cloudinary necesitan el runtime Node (no Edge).
export const runtime = 'nodejs'
// La optimización (weld/dedup/prune/textureCompress) puede tardar más que una
// firma simple — margen generoso para modelos grandes.
export const maxDuration = 60
// Esta ruta sube un archivo binario en cada request — nunca debe cachearse ni
// intentar generarse estáticamente.
export const dynamic = 'force-dynamic'

// Variables de entorno que necesita esta ruta (configuradas en Vercel → Settings →
// Environment Variables, NUNCA en el código ni como NEXT_PUBLIC_):
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Las lee lib/cloudinary.ts — ver getCloudinaryConfig().

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

/**
 * NodeIO necesita el decoder de Draco registrado para poder LEER un .glb que
 * ya viene comprimido con Draco (export típico de Blender y similares) — sin
 * esto, io.readBinary() truena incluso antes de llegar a optimizar nada
 * (confirmado con el propio .glb de referencia del cliente, que sí trae
 * Draco). Esto es solo para DECODIFICAR de entrada: la optimización de
 * salida sigue sin usar Draco (ver comentario de optimizeGlb) — no hace
 * falta el encoder para eso, pero se registra igual porque NodeIO lo pide
 * como par si se declara la extensión de Draco.
 */
async function makeIO() {
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })
}

/**
 * Optimiza un .glb con gltf-transform: suelda vértices duplicados, quita
 * datos huérfanos y (si sharp coopera) recomprime texturas a WebP 1024x1024.
 * La SALIDA no usa Draco — no está disponible en el entorno serverless de
 * Vercel (por eso no se llama a ningún draco().encoder() al escribir).
 *
 * Con dos niveles de respaldo, nunca deja la subida sin resultado:
 * 1. Optimización completa (con textureCompress).
 * 2. Si eso falla (ej. sharp no coopera en este entorno), igual optimiza
 *    geometría (weld/dedup/prune) pero sin tocar texturas.
 * 3. Si incluso eso falla, sube el .glb tal cual llegó, sin optimizar —
 *    preferible a que el cliente se quede sin poder subir su modelo.
 */
async function optimizeGlb(buffer: Buffer): Promise<{ buffer: Buffer; optimized: 'full' | 'geometry-only' | 'none' }> {
  try {
    const io = await makeIO()
    const document = await io.readBinary(new Uint8Array(buffer))
    await document.transform(weld(), dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }))
    const out = await io.writeBinary(document)
    return { buffer: Buffer.from(out), optimized: 'full' }
  } catch (err) {
    console.error('[upload-3d] textureCompress falló, reintentando solo geometría:', err)
  }

  try {
    const io = await makeIO()
    const document = await io.readBinary(new Uint8Array(buffer))
    await document.transform(weld(), dedup(), prune())
    const out = await io.writeBinary(document)
    return { buffer: Buffer.from(out), optimized: 'geometry-only' }
  } catch (err) {
    console.error('[upload-3d] optimización de geometría también falló, subiendo el .glb sin optimizar:', err)
  }

  return { buffer, optimized: 'none' }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Cuerpo de la petición inválido.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Falta el archivo .glb.' }, { status: 400 })
  }
  // El MIME type de un .glb es inconsistente entre navegadores (model/gltf-binary,
  // application/octet-stream, o vacío) — la extensión del nombre es la validación
  // confiable, la misma que ya se revisó en el navegador con accept=".glb".
  if (!file.name.toLowerCase().endsWith('.glb')) {
    return NextResponse.json({ ok: false, error: 'Solo se aceptan archivos .glb.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es 50 MB.` },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const original = Buffer.from(arrayBuffer)

  const { buffer: optimizedBuffer, optimized } = await optimizeGlb(original)

  const publicId = `producto-${Date.now()}.glb`

  try {
    const result = await uploadBufferToCloudinary(optimizedBuffer, { resourceType: 'raw', publicId })
    return NextResponse.json({ ok: true, glbUrl: result.secure_url, optimized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al subir a Cloudinary.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
