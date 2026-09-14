'use client'

import { useRef, useState } from 'react'

type UploadState =
  | { phase: 'idle' }
  | { phase: 'optimizing' }
  | { phase: 'uploading' }
  | { phase: 'done' }
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
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al subir el modelo.')
      if (stageTimer.current) clearTimeout(stageTimer.current)
      setState({ phase: 'done' })
      onUploaded(data.glbUrl)
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
