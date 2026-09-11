'use client'

import type { DynamicSectionData } from '@/lib/types'
import CtaBanner from './CtaBanner'
import MenuGrid from './MenuGrid'
import TextBlock from './TextBlock'
import PhotoGallery from './PhotoGallery'
import Faq from './Faq'

type Updater<T> = T | ((prev: T) => T)

/**
 * Renderiza una sección dinámica según su plantilla (`data.type`).
 * `onChange` solo llega desde el /admin; en el sitio público va sin él.
 * Acepta un valor o un actualizador `(prev) => next` — cada plantilla lo usa
 * para no perder cambios cuando dos ediciones ocurren antes de un re-render
 * (ver EditProvider.setDynamic).
 */
export default function DynamicSection({
  id,
  data,
  edit,
  onChange,
}: {
  id: string
  data: DynamicSectionData
  edit?: boolean
  onChange?: (data: Updater<DynamicSectionData>) => void
}) {
  // El switch sobre `data.type` ya garantiza en runtime que cada plantilla recibe su
  // propio tipo de dato; TS no logra seguir esa relación a través de un Updater<T>
  // genérico (unión de valor|función) combinada con una unión discriminada — de ahí
  // el `as any` puntual, solo en esta llamada.
  switch (data.type) {
    case 'cta-banner':
      return <CtaBanner id={id} data={data} edit={edit} onChange={onChange as any} />
    case 'menu-grid':
      return <MenuGrid id={id} data={data} edit={edit} onChange={onChange as any} />
    case 'text-block':
      return <TextBlock id={id} data={data} edit={edit} onChange={onChange as any} />
    case 'photo-gallery':
      return <PhotoGallery id={id} data={data} edit={edit} onChange={onChange as any} />
    case 'faq':
      return <Faq id={id} data={data} edit={edit} onChange={onChange as any} />
    default:
      return null
  }
}
