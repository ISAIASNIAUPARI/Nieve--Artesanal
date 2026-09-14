'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { ProductSection3D } from '@/lib/types'
import EditableText from '../editable/EditableText'
import { SectionShell } from './sectionKit'
import { useIsMobileView } from '../useIsMobileView'

// Solo se pinta en /admin — cargado aparte para que el sitio público nunca
// descargue su código (mismo criterio que ButtonsEditor/FocalPointPicker, ver
// Obsidian, nota 11, Parte 9).
const Glb3DUploader = dynamic(() => import('./Glb3DUploader'), { ssr: false })

/**
 * Props de <model-viewer> — un Web Component, no un elemento de React, así
 * que se instancia con React.createElement (no como <model-viewer> en JSX)
 * para no necesitar declarar el tag en JSX.IntrinsicElements. Los atributos
 * "booleanos" (camera-controls, disable-zoom…) van con '' como valor: para
 * un Web Component la presencia del atributo es lo que importa, no un
 * booleano de JS — '' se renderiza como `attr=""` en el DOM, que es lo que
 * espera. Mismo patrón que la referencia (PRUEBA_SKILL/components/Objects3D.tsx).
 *
 * Valores fijos a propósito (no exponerlos como config): son los que dan el
 * giro lento y automático sin que el visitante pueda hacer zoom/pan y romper
 * el encuadre pensado para el producto.
 */
const MODEL_VIEWER_PROPS = {
  'camera-controls': '',
  'disable-zoom': '',
  'disable-pan': '',
  'disable-tap': '',
  'auto-rotate': '',
  'auto-rotate-delay': '0',
  'rotation-per-second': '16deg',
  'interaction-prompt': 'none',
  'touch-action': 'none',
  'shadow-intensity': '0.75',
  'shadow-softness': '1',
  exposure: '1.15',
  'camera-orbit': '25deg 82deg 2.6m',
  'min-camera-orbit': 'auto auto 2.6m',
  'max-camera-orbit': 'auto auto 2.6m',
  'field-of-view': '32deg',
  style: { width: '100%', height: '100%', display: 'block' },
}

export default function ProductViewer3D({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: ProductSection3D
  edit?: boolean
  onChange?: (data: ProductSection3D | ((prev: ProductSection3D) => ProductSection3D)) => void
}) {
  const isMobile = useIsMobileView()

  return (
    <SectionShell
      id={id}
      edit={edit}
      backgroundColor={data.backgroundColor}
      onBackgroundColorChange={(next) => onChange?.((prev) => ({ ...prev, backgroundColor: next }))}
    >
      {edit && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 20,
            background: '#1c1310',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.05em',
            padding: '4px 9px',
            borderRadius: 999,
          }}
        >
          3D
        </span>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: isMobile ? 28 : 48,
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ flex: '1 1 380px', maxWidth: 480, width: '100%' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: isMobile ? '1/1' : '3/4',
              maxHeight: isMobile ? '56vh' : '76vh',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'radial-gradient(circle at 50% 38%, #262220 0%, #100e0d 75%)',
              boxShadow: '0 24px 60px -20px #00000066',
            }}
          >
            {React.createElement('model-viewer', {
              ...MODEL_VIEWER_PROPS,
              src: data.glbUrl,
              alt: data.title?.trim() || 'Producto en 3D',
            })}
          </div>
          {edit && (
            <>
              <div style={{ marginTop: 8, fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Modelo 3D (.glb):</strong>{' '}
                <span style={{ wordBreak: 'break-all' }}>{data.glbUrl || 'sin configurar'}</span>
              </div>
              <Glb3DUploader onUploaded={(url) => onChange?.((prev) => ({ ...prev, glbUrl: url }))} />
            </>
          )}
        </div>

        <div style={{ flex: '1 1 320px', maxWidth: 480, textAlign: isMobile ? 'center' : 'left' }}>
          {(edit || Boolean(data.subtitle && data.subtitle.trim() !== '')) && (
            <div style={{ display: 'block', width: '100%' }}>
              <EditableText
                edit={edit}
                value={data.subtitle}
                onChange={(v) => onChange?.((prev) => ({ ...prev, subtitle: v }))}
                placeholder="Etiqueta superior (opcional)"
                alwaysShowOutline
                style={{
                  display: 'inline-block',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              />
            </div>
          )}
          <div style={{ display: 'block', width: '100%' }}>
            <EditableText
              as="h2"
              edit={edit}
              value={data.title}
              onChange={(v) => onChange?.((prev) => ({ ...prev, title: v }))}
              placeholder="Nombre del producto"
              style={{
                fontFamily: 'var(--font-dm-serif), serif',
                fontSize: isMobile ? 26 : 'clamp(28px,3.5vw,42px)',
                lineHeight: 1.2,
                color: 'var(--ink)',
                margin: '0 0 14px',
              }}
            />
          </div>
          <EditableText
            as="p"
            edit={edit}
            value={data.description}
            onChange={(v) => onChange?.((prev) => ({ ...prev, description: v }))}
            placeholder="Descripción del producto"
            style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--ink-soft)', margin: '0 0 20px' }}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {(edit || Boolean(data.priceOriginal && data.priceOriginal.trim() !== '')) && (
              <EditableText
                edit={edit}
                value={data.priceOriginal}
                onChange={(v) => onChange?.((prev) => ({ ...prev, priceOriginal: v }))}
                placeholder="Precio anterior (opcional)"
                alwaysShowOutline
                style={{ fontSize: 17, color: 'var(--ink-soft)', textDecoration: 'line-through' }}
              />
            )}
            <EditableText
              edit={edit}
              value={data.price}
              onChange={(v) => onChange?.((prev) => ({ ...prev, price: v }))}
              placeholder="$0.00"
              style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
