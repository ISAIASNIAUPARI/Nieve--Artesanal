'use client'

import { useRef, useState } from 'react'

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; pct: number }
  | { phase: 'optimizing' }
  | { phase: 'done' }
  | { phase: 'done-manual'; url: string }
  | { phase: 'error'; message: string; retryPublicId?: string }

const MAX_BYTES = 50 * 1024 * 1024

interface RawUploadSign {
  ok: true
  cloudName: string
  apiKey: string
  folder: string
  publicId: string
  timestamp: number
  signature: string
}

// Cloudinary recomienda partes de 20 MB para subida en partes (mínimo 5 MB,
// salvo la última). La cuenta de este proyecto tiene un máximo de ~10 MB por
// petición para recursos "raw" — con el archivo partido en trozos de 20 MB
// seguiríamos topando ese límite, así que se usa un tamaño de parte por
// debajo del límite conocido de la cuenta, con margen.
const CHUNK_SIZE = 8 * 1024 * 1024 // 8 MB

/**
 * Sube el .glb crudo directo navegador → Cloudinary, partido en trozos
 * (subida en partes de Cloudinary: mismo endpoint de siempre, pero cada
 * trozo va con un `Content-Range` y un `X-Unique-Upload-Id` compartido).
 * Necesario porque la cuenta de Cloudinary tiene un límite de tamaño por
 * petición individual (~10 MB para recursos "raw") — partiendo el archivo,
 * ninguna petición sola supera ese límite, sin importar cuánto pese el
 * archivo completo.
 */
function uploadRawToCloudinaryChunked(file: File, sign: RawUploadSign, onProgress: (pct: number) => void): Promise<void> {
  const uploadId = crypto.randomUUID()
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))

  function uploadChunk(index: number): Promise<void> {
    const start = index * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const form = new FormData()
    form.append('file', chunk, file.name)
    form.append('api_key', sign.apiKey)
    form.append('timestamp', String(sign.timestamp))
    form.append('folder', sign.folder)
    form.append('public_id', sign.publicId)
    form.append('signature', sign.signature)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/raw/upload`)
      xhr.setRequestHeader('X-Unique-Upload-Id', uploadId)
      xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${file.size}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(((start + e.loaded) / file.size) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
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
  }

  return (async () => {
    for (let i = 0; i < totalChunks; i++) {
      await uploadChunk(i)
    }
  })()
}

/**
 * Drop zone para reemplazar el .glb de una sección product-3d — en dos pasos:
 *
 *   1. El navegador sube el .glb TAL CUAL directo a Cloudinary, partido en
 *      trozos (con una firma de un solo uso de /api/admin/upload-3d-sign),
 *      igual que ya hacen las imágenes y el video (aunque ellas sin partir,
 *      porque no topan el límite de tamaño de sus resource_type). Así nunca
 *      pasa por el body de una función serverless de Vercel — antes, con el
 *      archivo pasando entero por nuestro servidor, cualquier .glb de más de
 *      ~4 MB fallaba con un 413 (límite de la plataforma, no de esta app)
 *      sin llegar a ejecutarse nuestro código. Y subir directo pero de una
 *      sola vez tampoco alcanza: la cuenta de Cloudinary tiene su propio
 *      límite de ~10 MB por petición para recursos "raw" — por eso va en
 *      trozos (ver uploadRawToCloudinaryChunked).
 *   2. /api/admin/optimize-3d descarga ese archivo por su URL (un fetch
 *      saliente del servidor no tiene ese límite), lo optimiza con
 *      gltf-transform (mismo pipeline de siempre) y sube la versión final.
 *
 * Si el paso 2 falla, no hace falta volver a subir el archivo: se reintenta
 * solo la optimización con el mismo public_id temporal (ver retryPublicId).
 *
 * "Guardar cambios" es quien de verdad publica el resultado (commit a
 * GitHub) — igual que con imágenes/video.
 */
export default function Glb3DUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function runOptimize(publicId: string) {
    setState({ phase: 'optimizing' })
    try {
      const res = await fetch('/api/admin/optimize-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        const detail = data?.error || `Error del servidor (${res.status}${res.statusText ? ' ' + res.statusText : ''}).`
        setState({ phase: 'error', message: detail, retryPublicId: data?.retryPublicId || publicId })
        return
      }
      // La subida a Cloudinary ya fue exitosa en este punto — si onUploaded()
      // falla al actualizar el campo en el admin, no es un error de subida:
      // no hay que perder la URL ni pedir que se suba el archivo de nuevo.
      try {
        onUploaded(data.glbUrl)
        setState({ phase: 'done' })
      } catch (callbackErr) {
        console.error('[Glb3DUploader] subida exitosa pero falló al actualizar el campo:', callbackErr)
        setState({ phase: 'done-manual', url: data.glbUrl })
      }
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Error al optimizar el modelo.',
        retryPublicId: publicId,
      })
    }
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setState({ phase: 'error', message: 'Solo se aceptan archivos .glb.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setState({ phase: 'error', message: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es 50 MB.` })
      return
    }

    setState({ phase: 'uploading', pct: 0 })
    try {
      const signRes = await fetch('/api/admin/upload-3d-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytes: file.size }),
      })
      const sign = await signRes.json().catch(() => null)
      if (!signRes.ok || !sign?.ok) {
        throw new Error(sign?.error || 'No se pudo iniciar la subida.')
      }
      await uploadRawToCloudinaryChunked(file, sign, (pct) => setState({ phase: 'uploading', pct }))
      await runOptimize(sign.publicId)
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Error al subir el modelo.' })
    }
  }

  const busy = state.phase === 'uploading' || state.phase === 'optimizing'

  return (
    <div style={{ marginTop: 8 }}>
      <div
        onClick={() => {
          if (busy) return
          if (state.phase === 'error' && state.retryPublicId) {
            runOptimize(state.retryPublicId)
            return
          }
          inputRef.current?.click()
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!busy) setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          if (busy) return
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        style={{
          padding: '14px 12px',
          borderRadius: 10,
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : '#00000033'}`,
          background: dragOver ? '#00000008' : 'transparent',
          textAlign: 'center',
          fontSize: 11,
          fontFamily: 'system-ui, sans-serif',
          color: 'var(--ink-soft)',
          cursor: busy ? 'default' : 'pointer',
          transition: 'border-color .15s, background-color .15s',
        }}
      >
        {state.phase === 'idle' && <span>Arrastra tu .glb aquí o haz clic para seleccionar</span>}
        {state.phase === 'uploading' && <span>⏳ Subiendo… {state.pct}%</span>}
        {state.phase === 'optimizing' && <span>⏳ Optimizando modelo…</span>}
        {state.phase === 'done' && (
          <span style={{ color: '#2f8f52', fontWeight: 600 }}>✓ Modelo actualizado — Guarda los cambios para publicar</span>
        )}
        {state.phase === 'done-manual' && (
          <span style={{ color: '#c0392b' }}>
            ⚠ El modelo se subió, pero no se pudo actualizar el campo automáticamente. Copia esta URL y pégala
            manualmente en el campo del modelo 3D:
            <br />
            <span style={{ wordBreak: 'break-all', fontWeight: 600 }}>{state.url}</span>
          </span>
        )}
        {state.phase === 'error' && (
          <span style={{ color: '#c0392b' }}>
            ⚠ {state.message} —{' '}
            <span style={{ textDecoration: 'underline', fontWeight: 600 }}>
              {state.retryPublicId ? 'clic para reintentar (sin volver a subir)' : 'clic para reintentar'}
            </span>
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".glb"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
