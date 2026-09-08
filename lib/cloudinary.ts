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
