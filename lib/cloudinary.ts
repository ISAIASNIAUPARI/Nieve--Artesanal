import { v2 as cloudinary } from 'cloudinary'

/**
 * Configuración de Cloudinary — SOLO servidor.
 * CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET nunca deben exponerse al navegador
 * (nada de NEXT_PUBLIC_). Este archivo solo se importa desde rutas /api.
 */

export const CLOUDINARY_FOLDER = 'nieve-artesanal'

/** Transformación de entrega para imágenes — el mismo patrón que las URLs ya migradas. */
export const IMAGE_DELIVERY = 'f_auto,q_auto'

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Faltan variables de entorno de Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET son obligatorias.'
    )
  }
  return { cloudName, apiKey, apiSecret }
}

/**
 * Firma un conjunto de parámetros para una subida directa navegador → Cloudinary.
 * El secreto se usa aquí, en el servidor, y nunca se envía al cliente: al navegador
 * solo viaja la firma (un hash de un solo uso, atado a `timestamp`).
 */
export function signUploadParams(params: Record<string, string | number>): string {
  const { apiSecret } = getCloudinaryConfig()
  return cloudinary.utils.api_sign_request(params, apiSecret)
}

/** URL de entrega optimizada para una imagen ya subida (por su public_id). */
export function imageDeliveryUrl(cloudName: string, publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${IMAGE_DELIVERY}/${publicId}`
}

let sdkConfigured = false

/** El SDK de Cloudinary necesita cloudinary.config() una vez por proceso antes de
 * usar cloudinary.uploader.* — a diferencia de signUploadParams (que recibe el
 * secreto como parámetro), .uploader.upload_stream lee la config global del SDK. */
function ensureSdkConfigured() {
  if (sdkConfigured) return
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
  sdkConfigured = true
}

/**
 * Sube un Buffer directo a Cloudinary DESDE EL SERVIDOR (no es el flujo firmado
 * navegador→Cloudinary que usan imágenes/video) — para archivos que el propio
 * servidor ya tiene en memoria, como el .glb optimizado con gltf-transform.
 * `publicId` debe incluir la extensión (ej. "producto-123.glb"): a diferencia
 * de las imágenes, un recurso "raw" no la infiere sola.
 */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: { resourceType: 'raw' | 'image' | 'video'; publicId: string }
): Promise<{ secure_url: string; public_id: string; version: number }> {
  ensureSdkConfigured()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: opts.resourceType,
        folder: CLOUDINARY_FOLDER,
        public_id: opts.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) reject(error instanceof Error ? error : new Error('Cloudinary no devolvió resultado.'))
        else resolve(result as { secure_url: string; public_id: string; version: number })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Borra un recurso de Cloudinary por su public_id completo (con folder
 * incluido, ej. "nieve-artesanal/raw-tmp-123.glb"). Se usa para limpiar el
 * .glb temporal sin optimizar una vez que la versión final ya se subió — si
 * falla, no es grave (el temporal solo ocupa espacio, no rompe nada), así
 * que el llamador decide si quiere tratarlo como error o solo loguearlo.
 */
export function deleteFromCloudinary(publicId: string, resourceType: 'raw' | 'image' | 'video'): Promise<void> {
  ensureSdkConfigured()
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error) => {
      if (error) reject(error instanceof Error ? error : new Error('Cloudinary no pudo borrar el recurso.'))
      else resolve()
    })
  })
}
