'use client'

import { useRef, useState } from 'react'

type UploadState =
  | { phase: 'idle' }
  | { phase: 'optimizing' }
  | { phase: 'uploading' }
  | { phase: 'done' }
  | { phase: 'done-manual'; url: string }
  | { phase: 'error'; message: string }

const MAX_BYTES = 50 * 1024 * 1024

/**
 * Drop zone para reemplazar el .glb de una sección product-3d: arrastra o haz
 * clic, se sube a /api/admin/upload-3d (optimiza con gltf-transform y sube a
 * Cloudinary del lado del servidor), y al terminar llama `onUploaded(url)`
 * para que el componente padre actualice el campo glbUrl en el JSON de la
 * sección — "Guardar cambios" es quien de verdad lo publica (commit a
 * GitHub), igual que con imágenes/video.
 *
 * Los "pasos" de la barra de progreso son una sola petición de principio a
 * fin (el servidor optimiza y sube en un solo POST) — no hay forma de saber
 * desde el navegador en qué paso exacto va el servidor sin algo más pesado
 * (SSE/polling) que no hace falta aquí. "Optimizando" se muestra de
 * inmediato y pasa a "Subiendo a Cloudinary" tras una pausa breve, para dar
 * la sensación de las dos etapas reales sin inventar un mecanismo de
 * progreso en vivo.
 */
export default function Glb3DUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const stageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setState({ phase: 'error', message: 'Solo se aceptan archivos .glb.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setState({ phase: 'error', message: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es 50 MB.` })
      return
    }

    setState({ phase: 'optimizing' })
    if (stageTimer.current) clearTimeout(stageTimer.current)
    stageTimer.current = setTimeout(() => setState({ phase: 'uploading' }), 900)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload-3d', { method: 'POST', body: form })
      // Si la respuesta no es JSON (ej. un 413/502/504 del propio hosting, antes
      // de que nuestra ruta llegue a ejecutarse), data.error queda vacío — mejor
      // mostrar el status HTTP que un mensaje genérico sin ninguna pista.
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        const detail =
          data?.error ||
          `Error del servidor (${res.status}${res.statusText ? ' ' + res.statusText : ''}). Si el archivo es grande, puede deberse al límite de tamaño de subida del hosting.`
        throw new Error(detail)
      }
      if (stageTimer.current) clearTimeout(stageTimer.current)
      // A partir de acá el .glb YA está en Cloudinary — si onUploaded() falla al
      // actualizar el campo en el admin, no es un error de subida: no hay que
      // perder la URL ni pedirle al usuario que vuelva a subir el archivo.
      try {
        onUploaded(data.glbUrl)
        setState({ phase: 'done' })
      } catch (callbackErr) {
        console.error('[Glb3DUploader] subida exitosa pero falló al actualizar el campo:', callbackErr)
        setState({ phase: 'done-manual', url: data.glbUrl })
      }
    } catch (err) {
      if (stageTimer.current) clearTimeout(stageTimer.current)
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Error al subir el modelo.' })
    }
  }

  const busy = state.phase === 'optimizing' || state.phase === 'uploading'

  return (
    <div style={{ marginTop: 8 }}>
      <div
        onClick={() => !busy && inputRef.current?.click()}
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
        {state.phase === 'optimizing' && <span>⏳ Optimizando modelo…</span>}
        {state.phase === 'uploading' && <span>⏳ Subiendo a Cloudinary…</span>}
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
            ⚠ {state.message} — <span style={{ textDecoration: 'underline', fontWeight: 600 }}>clic para reintentar</span>
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
