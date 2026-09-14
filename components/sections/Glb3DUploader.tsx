'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; pct: number }
  | { phase: 'optimizing' }
  | { phase: 'done' }
  | { phase: 'done-manual'; url: string }
  | { phase: 'error'; message: string; retryBlobUrl?: string }

const MAX_BYTES = 50 * 1024 * 1024

/**
 * Drop zone para reemplazar el .glb de una sección product-3d — en dos pasos:
 *
 *   1. El navegador sube el .glb TAL CUAL directo a Vercel Blob (con un token
 *      de un solo uso de /api/admin/upload-3d-token), así nunca pasa por el
 *      body de nuestra función serverless. Antes esto se intentó con
 *      Cloudinary directo (como imágenes/video) y con subida en partes, pero
 *      la cuenta de Cloudinary tiene un tope de ~10 MB por recurso "raw" que
 *      ni partiendo el archivo se puede sortear (valida contra el tamaño
 *      TOTAL declarado, no contra cada petición). Vercel Blob no tiene ese
 *      tipo de tope y es el storage nativo de la misma plataforma del sitio.
 *   2. /api/admin/optimize-3d descarga ese archivo por su URL (un fetch
 *      saliente del servidor no tiene límite de body entrante), lo optimiza
 *      con gltf-transform (mismo pipeline de siempre) y sube la versión
 *      final a Cloudinary — el almacenamiento final del modelo optimizado
 *      no cambia, solo el paso intermedio de subida del archivo crudo.
 *
 * Si el paso 2 falla, no hace falta volver a subir el archivo: se reintenta
 * solo la optimización con la misma URL de Blob temporal (retryBlobUrl).
 *
 * "Guardar cambios" es quien de verdad publica el resultado (commit a
 * GitHub) — igual que con imágenes/video.
 */
export default function Glb3DUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function runOptimize(blobUrl: string) {
    setState({ phase: 'optimizing' })
    try {
      const res = await fetch('/api/admin/optimize-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrl }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        const detail = data?.error || `Error del servidor (${res.status}${res.statusText ? ' ' + res.statusText : ''}).`
        setState({ phase: 'error', message: detail, retryBlobUrl: data?.retryBlobUrl || blobUrl })
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
        retryBlobUrl: blobUrl,
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
    // Sin esto, si la subida a Vercel Blob se cuelga (visto en la práctica:
    // se queda pegada cerca del 100% sin terminar nunca, incluso con
    // archivos chicos) el usuario se queda con el spinner girando para
    // siempre, sin ningún error que mostrar ni forma de reintentar.
    const abortController = new AbortController()
    // Generoso a propósito (asume una subida lenta, ~150 KB/s) para no cortar
    // archivos grandes que de verdad están progresando, pero con un piso de
    // 60s para no ser demasiado agresivo con archivos chicos.
    const timeoutMs = Math.max(60_000, (file.size / (150 * 1024)) * 1000)
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
    try {
      const blob = await upload(`raw-tmp/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-3d-token',
        abortSignal: abortController.signal,
        onUploadProgress: ({ percentage }) => setState({ phase: 'uploading', pct: Math.round(percentage) }),
      })
      clearTimeout(timeoutId)
      await runOptimize(blob.url)
    } catch (err) {
      clearTimeout(timeoutId)
      const timedOut = abortController.signal.aborted
      setState({
        phase: 'error',
        message: timedOut
          ? `La subida tardó demasiado y se canceló (${Math.round(timeoutMs / 1000)}s). Puede ser un problema de conexión — reintenta o prueba con otra red.`
          : err instanceof Error
            ? err.message
            : 'Error al subir el modelo.',
      })
    }
  }

  const busy = state.phase === 'uploading' || state.phase === 'optimizing'

  return (
    <div style={{ marginTop: 8 }}>
      <div
        onClick={() => {
          if (busy) return
          if (state.phase === 'error' && state.retryBlobUrl) {
            runOptimize(state.retryBlobUrl)
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
              {state.retryBlobUrl ? 'clic para reintentar (sin volver a subir)' : 'clic para reintentar'}
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
