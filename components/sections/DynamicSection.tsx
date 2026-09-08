'use client'

import type { DynamicSectionData } from '@/lib/types'
import CtaBanner from './CtaBanner'
import MenuGrid from './MenuGrid'
import TextBlock from './TextBlock'
import PhotoGallery from './PhotoGallery'
import Faq from './Faq'

/**
 * Renderiza una sección dinámica según su plantilla (`data.type`).
 * `onChange` solo llega desde el /admin; en el sitio público va sin él.
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
  onChange?: (data: DynamicSectionData) => void
}) {
  switch (data.type) {
    case 'cta-banner':
      return <CtaBanner id={id} data={data} edit={edit} onChange={onChange as (d: typeof data) => void} />
    case 'menu-grid':
      return <MenuGrid id={id} data={data} edit={edit} onChange={onChange as (d: typeof data) => void} />
    case 'text-block':
      return <TextBlock id={id} data={data} edit={edit} onChange={onChange as (d: typeof data) => void} />
    case 'photo-gallery':
      return <PhotoGallery id={id} data={data} edit={edit} onChange={onChange as (d: typeof data) => void} />
    case 'faq':
      return <Faq id={id} data={data} edit={edit} onChange={onChange as (d: typeof data) => void} />
    default:
      return null
  }
}
