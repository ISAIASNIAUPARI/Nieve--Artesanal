import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import draco3d from 'draco3dgltf'

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
export async function optimizeGlb(buffer: Buffer): Promise<{ buffer: Buffer; optimized: 'full' | 'geometry-only' | 'none' }> {
  try {
    const io = await makeIO()
    const document = await io.readBinary(new Uint8Array(buffer))
    await document.transform(weld(), dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }))
    const out = await io.writeBinary(document)
    return { buffer: Buffer.from(out), optimized: 'full' }
  } catch (err) {
    console.error('[glbOptimize] textureCompress falló, reintentando solo geometría:', err)
  }

  try {
    const io = await makeIO()
    const document = await io.readBinary(new Uint8Array(buffer))
    await document.transform(weld(), dedup(), prune())
    const out = await io.writeBinary(document)
    return { buffer: Buffer.from(out), optimized: 'geometry-only' }
  } catch (err) {
    console.error('[glbOptimize] optimización de geometría también falló, subiendo el .glb sin optimizar:', err)
  }

  return { buffer, optimized: 'none' }
}
