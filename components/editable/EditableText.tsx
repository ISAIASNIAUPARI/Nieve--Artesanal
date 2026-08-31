'use client'

import { useLayoutEffect, useRef } from 'react'

interface EditableTextProps {
  value?: string
  onChange?: (value: string) => void
  edit?: boolean
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'strong'
  style?: React.CSSProperties
  placeholder?: string
  /** Si el elemento va dentro de un <a>, evita que el click navegue mientras se edita. */
  stopClickNavigation?: boolean
}

/**
 * Texto editable "in place": en modo lectura es un simple <span>/<p>/etc.
 * En modo edición se vuelve contentEditable — clic, escribe, clic afuera y se guarda
 * en el estado del admin (todavía no en GitHub; eso pasa al presionar "Guardar").
 *
 * IMPORTANTE: el contenido del contentEditable NO se pasa como children de React.
 * React y el navegador pelean por el mismo DOM cuando un contentEditable tiene
 * children controlados — cada re-render (aunque sea por OTRO campo) puede pisar lo
 * que el usuario está escribiendo o desalinear qué texto es cuál. En vez de eso, el
 * texto se sincroniza a mano vía ref, y solo cuando el campo no tiene el foco.
 */
export default function EditableText({
  value,
  onChange,
  edit,
  as: Tag = 'span',
  style,
  placeholder = 'Escribe aquí…',
  stopClickNavigation,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null)
  const focused = useRef(false)

  useLayoutEffect(() => {
    if (!edit) return
    const el = ref.current
    if (!el) return
    if (!focused.current && el.innerText !== (value || '')) {
      el.innerText = value || ''
    }
  }, [value, edit])

  if (!edit) {
    if (!value) return null
    return <Tag style={style}>{value}</Tag>
  }

  return (
    <Tag
      // @ts-expect-error -- ref genérica para cualquier tag de texto
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onClick={(e) => {
        if (stopClickNavigation) e.preventDefault()
      }}
      onFocus={(e) => {
        focused.current = true
        ;(e.currentTarget as HTMLElement).style.outlineColor = '#3b82f6'
        ;(e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f61a'
      }}
      onBlur={(e) => {
        focused.current = false
        ;(e.currentTarget as HTMLElement).style.outlineColor = '#ffffff00'
        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
        const text = (e.currentTarget as HTMLElement).innerText.replace(/\n+$/, '').trim()
        if (text !== (value || '')) onChange?.(text)
      }}
      onMouseEnter={(e) => {
        if (!focused.current) (e.currentTarget as HTMLElement).style.outlineColor = '#3b82f688'
      }}
      onMouseLeave={(e) => {
        if (!focused.current) (e.currentTarget as HTMLElement).style.outlineColor = '#ffffff00'
      }}
      style={{
        ...style,
        outline: '1px dashed #ffffff00',
        outlineOffset: 4,
        borderRadius: 4,
        cursor: 'text',
        transition: 'outline-color .15s, background-color .15s',
        minWidth: 24,
        minHeight: '1em',
        display: style?.display || 'inline-block',
      }}
    />
  )
}
