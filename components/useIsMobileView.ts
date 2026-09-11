'use client'

import { useEffect, useState } from 'react'
import { useEditOptional } from './admin/EditContext'

const MOBILE_BREAKPOINT = '(max-width: 768px)'

/**
 * true en pantallas reales ≤768px (sitio público) — o, dentro del admin, cuando
 * el cliente activó el toggle 📱 de vista previa (`viewMode`), sin importar el
 * ancho real de la ventana de escritorio. Así el frame de 390px del admin puede
 * mostrar el layout móvil aunque el navegador esté abierto en pantalla ancha,
 * que es justo el caso en el que `vw`/`@media` no sirven (miden el viewport
 * real, no el frame) y hace falta decidir "es móvil" desde JS.
 */
export function useIsMobileView() {
  const editCtx = useEditOptional()
  const [autoMobile, setAutoMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT)
    const update = () => setAutoMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return editCtx ? editCtx.viewMode === 'mobile' : autoMobile
}
