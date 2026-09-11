'use client'

import type { Button, LocationSectionData } from '@/lib/types'
import { safeHref } from '@/lib/types'
import EditableText from './editable/EditableText'
import ContactForm from './ContactForm'
import SectionButtons from './sections/SectionButtons'
import dynamic from 'next/dynamic'

// Solo se pinta en /admin — cargado aparte para que el sitio público nunca
// descargue su código (ni el de @dnd-kit, del que depende SectionButtons).
const ButtonsEditor = dynamic(() => import('./admin/ButtonsEditor'), { ssr: false })
import { useIsMobileView } from './useIsMobileView'

interface LocationProps {
  data?: LocationSectionData
  edit?: boolean
  onChange?: (field: keyof LocationSectionData, value: string) => void
  onButtonsChange?: (buttons: Button[]) => void
}

/**
 * Src del mapa embebido, sin API key de Google: si `mapEmbedUrl` trae coordenadas
 * "@lat,lng" (el formato largo de un link de Google Maps), se arma el embed directo
 * sobre ese punto; si no, se busca por el texto de `address`. Sin ninguno de los
 * dos, no hay mapa que mostrar. Nota: `mapUrl` (el del botón "Abrir en Maps") NO
 * sirve para esto — suele ser un link corto (maps.app.goo.gl/...) sin coordenadas
 * en su propio texto.
 */
function mapEmbedSrc(mapEmbedUrl?: string, address?: string): string | null {
  const coords = mapEmbedUrl?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coords) return `https://www.google.com/maps?q=${coords[1]},${coords[2]}&z=16&output=embed`
  if (address?.trim()) return `https://www.google.com/maps?q=${encodeURIComponent(address.trim())}&output=embed`
  return null
}

const infoRow: React.CSSProperties = { display: 'flex', gap: 14, alignItems: 'flex-start' }
const iconBadge: React.CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: '50%',
  background: '#ffffff14',
  border: '1px solid #ffffff22',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 17,
}
const infoValue: React.CSSProperties = { color: '#e8e2d8', fontSize: 15, lineHeight: 1.5 }

export default function Location({ data, edit, onChange, onButtonsChange }: LocationProps) {
  const isMobile = useIsMobileView()
  if (!data) return null

  const mapSrc = mapEmbedSrc(data.mapEmbedUrl, data.address)

  return (
    <>
    <section
      id="location"
      style={{
        position: 'relative',
        padding: isMobile ? '48px 20px' : '100px 6vw',
        background: 'var(--ink)',
        color: '#fff',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 32 : 64,
      }}
    >
      <div>
        <EditableText
          edit={edit}
          value={data.eyebrow}
          onChange={(v) => onChange?.('eyebrow', v)}
          placeholder="Antetítulo"
          style={{ display: 'inline-block', color: 'var(--accent-light)', fontWeight: 600, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase' }}
        />
        <EditableText
          as="h2"
          edit={edit}
          value={data.heading}
          onChange={(v) => onChange?.('heading', v)}
          placeholder="Título de la sección"
          style={{
            fontFamily: 'var(--font-dm-serif), serif',
            fontSize: isMobile ? 26 : 'clamp(28px,3.5vw,42px)',
            lineHeight: 1.2,
            margin: '12px 0 28px',
            color: '#fff',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(edit || data.address) && (
            <div style={infoRow}>
              <span style={iconBadge}>📍</span>
              <div>
                <strong style={{ color: '#fff' }}>Ubicación</strong>
                <div style={infoValue}>
                  <EditableText edit={edit} value={data.address} onChange={(v) => onChange?.('address', v)} placeholder="Dirección" />
                </div>
              </div>
            </div>
          )}
          {(edit || data.phone) && (
            <div style={infoRow}>
              <span style={iconBadge}>💬</span>
              <div>
                <strong style={{ color: '#fff' }}>WhatsApp</strong>
                <div style={infoValue}>
                  <EditableText edit={edit} value={data.phone} onChange={(v) => onChange?.('phone', v)} placeholder="+593 998381419" />
                </div>
              </div>
            </div>
          )}
          {(edit || data.email) && (
            <div style={infoRow}>
              <span style={iconBadge}>✉️</span>
              <div>
                <strong style={{ color: '#fff' }}>Correo</strong>
                <div style={infoValue}>
                  <EditableText edit={edit} value={data.email} onChange={(v) => onChange?.('email', v)} placeholder="hola@tunegocio.com" />
                </div>
              </div>
            </div>
          )}
          {(edit || data.schedule) && (
            <div style={infoRow}>
              <span style={iconBadge}>🕐</span>
              <div>
                <strong style={{ color: '#fff' }}>Horarios</strong>
                <div style={infoValue}>
                  <EditableText edit={edit} value={data.schedule} onChange={(v) => onChange?.('schedule', v)} placeholder="Horario" />
                </div>
              </div>
            </div>
          )}
        </div>

        {(edit || mapSrc) && (
          <div style={{ position: 'relative', marginTop: 24, borderRadius: 14, overflow: 'hidden', border: '1px solid #ffffff22' }}>
            {mapSrc ? (
              <iframe
                src={mapSrc}
                loading="lazy"
                title="Mapa de ubicación"
                style={{ display: 'block', width: '100%', height: 240, border: 0 }}
              />
            ) : (
              <div
                style={{
                  height: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 20,
                  color: '#ffffff66',
                  fontSize: 13,
                  background: '#ffffff08',
                }}
              >
                Agrega una dirección arriba para mostrar el mapa.
              </div>
            )}
            {data.mapUrl?.trim() && (
              <a
                href={safeHref(data.mapUrl)}
                target="_blank"
                rel="noreferrer"
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#000000cc',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Abrir en Maps ↗
              </a>
            )}
          </div>
        )}

        <SectionButtons buttons={data.buttons} tone="dark" edit={edit} onReorder={onButtonsChange} style={{ marginTop: 28 }} />
      </div>
      <ContactForm whatsappNumber={data.phone} />
    </section>
    {edit && onButtonsChange && !isMobile && (
      <ButtonsEditor buttons={data.buttons ?? []} onChange={onButtonsChange} sectionLabel="Ubicación" />
    )}
    </>
  )
}
