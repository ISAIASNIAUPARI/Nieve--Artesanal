'use client'

import { useMemo, useRef, useState } from 'react'

interface FocalPointPickerProps {
  src: string
  /** ancho / alto del recorte real en la página, ej. 16/9, 4/3, 1, 3/2. */
  aspectRatio: number
  focalX?: number
  focalY?: number
  onApply: (x: number, y: number) => void
  onCancel: () => void
}

/**
 * Modal para elegir el punto focal de una imagen: se ve la foto completa (sin
 * recortar) con una guía punteada mostrando el recorte real a `aspectRatio`, y
 * un punto que se arrastra o se coloca con un clic. Abajo, dos miniaturas
 * comparan "Antes (centro)" contra "Después (tu punto)".
 *
 * No toca el JSON: solo llama a `onApply(x, y)` cuando el usuario confirma —
 * quien lo use decide qué hacer con esas coordenadas (igual que cualquier
 * otro campo editable, se guarda al pulsar "Guardar" en la barra del admin).
 */
export default function FocalPointPicker({ src, aspectRatio, focalX, focalY, onApply, onCancel }: FocalPointPickerProps) {
  const [x, setX] = useState(focalX ?? 50)
  const [y, setY] = useState(focalY ?? 50)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragging = useRef(false)

  const updateFromPointer = (clientX: number, clientY: number) => {
    const el = imgRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 100
    const ny = ((clientY - rect.top) / rect.height) * 100
    setX(Math.round(Math.min(100, Math.max(0, nx))))
    setY(Math.round(Math.min(100, Math.max(0, ny))))
  }

  // Rectángulo (en % de la imagen completa) que representa el recorte real con object-fit:cover.
  const cropRect = useMemo(() => {
    if (!natural) return null
    const imgAR = natural.w / natural.h
    let wFrac = 1
    let hFrac = 1
    if (imgAR > aspectRatio) {
      wFrac = aspectRatio / imgAR
    } else {
      hFrac = imgAR / aspectRatio
    }
    const left = (1 - wFrac) * (x / 100) * 100
    const top = (1 - hFrac) * (y / 100) * 100
    return { left, top, width: wFrac * 100, height: hFrac * 100 }
  }, [natural, aspectRatio, x, y])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: '#000000ad',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 16px',
        overflowY: 'auto',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#1c1310',
          color: '#fff',
          borderRadius: 14,
          border: '1px solid #ffffff22',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 15 }}>⊕ Punto focal</strong>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.65 }}>
          Clic o arrastra sobre la foto para marcar lo que siempre debe verse. El recuadro punteado es el recorte real.
        </p>

        <div
          style={{
            position: 'relative',
            width: '100%',
            background: '#000',
            borderRadius: 10,
            overflow: 'hidden',
            cursor: 'crosshair',
            touchAction: 'none',
            userSelect: 'none',
            lineHeight: 0,
          }}
          onPointerDown={(e) => {
            dragging.current = true
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            updateFromPointer(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            if (dragging.current) updateFromPointer(e.clientX, e.clientY)
          }}
          onPointerUp={() => {
            dragging.current = false
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget
              setNatural({ w: el.naturalWidth, h: el.naturalHeight })
            }}
            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '55vh', objectFit: 'contain', margin: '0 auto' }}
          />

          {cropRect && (
            <div
              style={{
                position: 'absolute',
                left: `${cropRect.left}%`,
                top: `${cropRect.top}%`,
                width: `${cropRect.width}%`,
                height: `${cropRect.height}%`,
                border: '2px dashed #ffffffcc',
                boxShadow: '0 0 0 2000px #00000066',
                pointerEvents: 'none',
              }}
            />
          )}

          <div
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid #1c1310',
              boxShadow: '0 0 0 1px #ffffffaa',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, opacity: 0.6, textAlign: 'center' }}>Antes (centro)</p>
            <div style={{ aspectRatio: String(aspectRatio), borderRadius: 8, overflow: 'hidden', background: '#000' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%', display: 'block' }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, opacity: 0.6, textAlign: 'center' }}>Después (tu punto)</p>
            <div style={{ aspectRatio: String(aspectRatio), borderRadius: 8, overflow: 'hidden', background: '#000' }}>
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${x}% ${y}%`, display: 'block' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApply(x, y)}
            style={{
              padding: '9px 20px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: '#d7742f',
              color: '#fff',
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
