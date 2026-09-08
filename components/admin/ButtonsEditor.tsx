'use client'

import type { Button, HrefType } from '@/lib/types'
import { MAX_BUTTONS, PAGE_ANCHORS, isSafeHref, newButton, resolveButtonHref } from '@/lib/types'

const TYPE_LABELS: Record<HrefType, string> = {
  anchor: 'Misma página',
  url: 'URL externa',
  whatsapp: 'WhatsApp',
  phone: 'Teléfono',
}

const box: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  color: '#fff',
  background: '#0000008c',
  border: '1px solid #ffffff2b',
  borderRadius: 12,
  padding: 14,
  margin: '18px 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: 520,
  textAlign: 'left',
}

const field: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid #ffffff3b',
  background: '#00000066',
  color: '#fff',
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
}

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  border: '1px solid #ffffff3b',
  background: enabled ? '#ffffff17' : '#ffffff08',
  color: enabled ? '#fff' : '#ffffff55',
  borderRadius: 8,
  width: 30,
  height: 30,
  cursor: enabled ? 'pointer' : 'default',
  fontSize: 14,
  lineHeight: 1,
})

/**
 * Editor de la barra de botones de una sección (0 a 5 botones).
 * Es "controlado": recibe `buttons` y llama `onChange` con el array nuevo
 * (añadir, borrar, reordenar, editar). El commit al JSON lo hace "Guardar".
 */
export default function ButtonsEditor({
  buttons,
  onChange,
  sectionLabel,
}: {
  buttons: Button[]
  onChange: (buttons: Button[]) => void
  sectionLabel: string
}) {
  const update = (id: string, patch: Partial<Button>) =>
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const remove = (id: string) => onChange(buttons.filter((b) => b.id !== id))

  const move = (index: number, dir: -1 | 1) => {
    const next = [...buttons]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const add = () => {
    if (buttons.length >= MAX_BUTTONS) return
    onChange([...buttons, newButton()])
  }

  return (
    <div style={box} onClick={(e) => e.stopPropagation()}>
      <strong style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Botones de «{sectionLabel}» ({buttons.length}/{MAX_BUTTONS})
      </strong>

      {buttons.length === 0 && <span style={{ opacity: 0.6 }}>Esta sección no tiene botones.</span>}

      {buttons.map((b, i) => {
        const textError = !b.text?.trim()
        const hrefError = !b.href?.trim() || !isSafeHref(b.href)
        return (
          <div
            key={b.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 10,
              borderRadius: 10,
              background: '#ffffff0f',
              border: '1px solid #ffffff1f',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.5, fontSize: 12, minWidth: 54 }}>
                {i === 0 ? 'Primario' : i === 1 ? 'Secundario' : `Terciario`}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button type="button" style={iconBtn(i > 0)} onClick={() => move(i, -1)} title="Subir" disabled={i === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  style={iconBtn(i < buttons.length - 1)}
                  onClick={() => move(i, 1)}
                  title="Bajar"
                  disabled={i === buttons.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  style={{ ...iconBtn(true), borderColor: '#ff8a8a55', color: '#ff8a8a' }}
                  onClick={() => remove(b.id)}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ opacity: 0.7 }}>Texto</span>
              <input
                style={{ ...field, borderColor: textError ? '#ff8a8a' : '#ffffff3b' }}
                value={b.text}
                onChange={(e) => update(b.id, { text: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ opacity: 0.7 }}>Tipo de destino</span>
              <select
                style={field}
                value={b.hrefType}
                onChange={(e) => update(b.id, { hrefType: e.target.value as HrefType })}
              >
                {(Object.keys(TYPE_LABELS) as HrefType[]).map((t) => (
                  <option key={t} value={t} style={{ color: '#000' }}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ opacity: 0.7 }}>Destino</span>
              {b.hrefType === 'anchor' ? (
                <select
                  style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
                  value={PAGE_ANCHORS.some((a) => a.value === b.href) ? b.href : '__custom'}
                  onChange={(e) =>
                    update(b.id, { href: e.target.value === '__custom' ? '' : e.target.value })
                  }
                >
                  {PAGE_ANCHORS.map((a) => (
                    <option key={a.value} value={a.value} style={{ color: '#000' }}>
                      {a.label} ({a.value})
                    </option>
                  ))}
                  <option value="__custom" style={{ color: '#000' }}>
                    Otra ancla…
                  </option>
                </select>
              ) : (
                <input
                  style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
                  type={b.hrefType === 'url' ? 'url' : 'text'}
                  inputMode={b.hrefType === 'whatsapp' || b.hrefType === 'phone' ? 'numeric' : undefined}
                  placeholder={
                    b.hrefType === 'url'
                      ? 'https://…'
                      : b.hrefType === 'whatsapp'
                        ? '593998381419 (país + número)'
                        : '593998381419'
                  }
                  value={b.href}
                  onChange={(e) => update(b.id, { href: e.target.value })}
                />
              )}
              {b.hrefType === 'anchor' && !PAGE_ANCHORS.some((a) => a.value === b.href) && (
                <input
                  style={{ ...field, borderColor: hrefError ? '#ff8a8a' : ('#ffffff3b') }}
                  placeholder="#mi-seccion"
                  value={b.href}
                  onChange={(e) => update(b.id, { href: e.target.value })}
                />
              )}
              {(b.hrefType === 'whatsapp' || b.hrefType === 'phone') && b.href.trim() && (
                <span style={{ opacity: 0.55, fontSize: 12 }}>→ {resolveButtonHref(b)}</span>
              )}
              {hrefError && <span style={{ color: '#ff8a8a', fontSize: 12 }}>Falta el destino o no está permitido.</span>}
            </label>
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        disabled={buttons.length >= MAX_BUTTONS}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px dashed #ffffff55',
          background: 'transparent',
          color: buttons.length >= MAX_BUTTONS ? '#ffffff55' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: buttons.length >= MAX_BUTTONS ? 'default' : 'pointer',
        }}
      >
        + Añadir botón
      </button>
    </div>
  )
}
