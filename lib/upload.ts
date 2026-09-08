'use client'

/**
 * Subida de medios desde el navegador directo a Cloudinary, en dos pasos:
 *
 *   1. POST a /api/admin/upload-image (o /upload-video) → el servidor valida
 *      formato/tamaño y devuelve una firma de un solo uso. El secreto de
 *      Cloudinary nunca llega aquí.
 *   2. El navegador sube el archivo a Cloudinary con XHR (para tener barra de
 *      progreso) usando esa firma.
 *
 * Devuelve la URL pública final para guardar en el JSON de contenido.
 */

export type MediaKind = 'image' | 'video'

const RULES: Record<MediaKind, { types: string[]; maxBytes: number; label: string }> = {
  image: {
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxBytes: 10 * 1024 * 1024,
    label: 'JPEG, PNG, WebP o AVIF',
  },
  video: {
    types: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxBytes: 200 * 1024 * 1024,
    label: 'MP4, MOV o WebM',
  },
}

export function validateMediaFile(file: File, kind: MediaKind): string | null {
  const rule = RULES[kind]
  if (!rule.types.includes(file.type)) {
    return `Formato no permitido (${file.type || 'desconocido'}). Usa ${rule.label}.`
  }
  if (file.size > rule.maxBytes) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es ${rule.maxBytes / 1024 / 1024} MB.`
  }
  return null
}

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  resource_type: string
  format?: string
}

export async function uploadMediaToCloudinary(
  file: File,
  kind: MediaKind,
  onProgress?: (pct: number) => void
): Promise<string> {
  const validationError = validateMediaFile(file, kind)
  if (validationError) throw new Error(validationError)

  const endpoint = kind === 'image' ? '/api/admin/upload-image' : '/api/admin/upload-video'
  const signRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: file.type, bytes: file.size }),
  })
  const sign = await signRes.json().catch(() => ({}))
  if (!signRes.ok || !sign.ok) {
    throw new Error(sign.error || 'No se pudo iniciar la subida.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sign.apiKey)
  form.append('timestamp', String(sign.timestamp))
  form.append('folder', sign.folder)
  form.append('signature', sign.signature)

  const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/${kind}/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Respuesta inesperada de Cloudinary.'))
        }
      } else {
        let msg = `Cloudinary respondió ${xhr.status}.`
        try {
          msg = JSON.parse(xhr.responseText)?.error?.message || msg
        } catch {
          /* deja el mensaje genérico */
        }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Error de red al subir a Cloudinary.'))
    xhr.send(form)
  })

  if (kind === 'image') {
    // Mismo patrón que las URLs ya migradas: /image/upload/f_auto,q_auto/<public_id>
    return `https://res.cloudinary.com/${sign.cloudName}/image/upload/f_auto,q_auto/${result.public_id}`
  }
  return result.secure_url
}
