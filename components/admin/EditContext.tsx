'use client'

import { createContext, useContext } from 'react'
import type { Button, DynamicSectionData, HomePageData, LayoutSection, MediaUploadStatus, PageLayout, SectionKey } from '@/lib/types'
import type { MediaKind } from '@/lib/upload'

export interface SaveResult {
  sha: string
  htmlUrl: string
}

/**
 * Solo el contexto y los dos hooks para LEERLO — nada de la implementación
 * (EditProvider.tsx, con setField/save/uploadMedia y su import de
 * @/lib/upload, vive aparte). `import type { MediaKind }` es un import
 * SOLO DE TIPO — TypeScript lo borra por completo al compilar, así que no
 * arrastra el código de subida real.
 *
 * Por qué existe este archivo aparte: componentes que se renderizan en el
 * sitio PÚBLICO (EditableImage, CloudinaryImage, VideoSection,
 * useIsMobileView) solo necesitan preguntar "¿hay un EditProvider por
 * encima, y si lo hay, estamos en modo móvil?" — no necesitan ninguna de
 * las funciones de guardado/subida. Si esos componentes importaran
 * `useEditOptional` desde EditProvider.tsx (el archivo con TODA la lógica),
 * el bundle de la página pública se llevaría de arrastre @dnd-kit, el
 * cliente de Cloudinary, etc. — código que nunca se ejecuta ahí pero que
 * igual se descarga. Ver Obsidian, nota 11, Parte 9.
 */
export interface EditContextValue {
  content: HomePageData
  layout: PageLayout
  dynamic: Record<string, DynamicSectionData>
  isDirty: boolean
  setField: (section: SectionKey, field: string, value: string) => void
  setObjectField: (section: SectionKey, field: string, prop: string, value: string) => void
  setButtons: (section: SectionKey, buttons: Button[]) => void
  setFocal: (section: SectionKey, field: string, x: number, y: number) => void
  setLayoutSections: (sections: LayoutSection[]) => void
  setDynamic: (id: string, updater: DynamicSectionData | ((prev: DynamicSectionData) => DynamicSectionData)) => void
  registerCreatedSection: (id: string, data: DynamicSectionData, layout: LayoutSection[]) => void
  unregisterDeletedSection: (id: string, layout: LayoutSection[]) => void
  uploadMedia: (section: SectionKey, field: string, file: File, kind: MediaKind) => Promise<boolean>
  uploads: Record<string, MediaUploadStatus>
  isDraggingFile: 'image' | 'video' | null
  saving: boolean
  saveError: string | null
  lastSaved: SaveResult | null
  save: () => Promise<void>
  viewMode: 'desktop' | 'mobile'
  setViewMode: (mode: 'desktop' | 'mobile') => void
}

export const EditContext = createContext<EditContextValue | null>(null)

export function useEdit() {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEdit debe usarse dentro de <EditProvider>')
  return ctx
}

/**
 * Igual que useEdit() pero devuelve null en vez de lanzar cuando no hay <EditProvider>
 * — para componentes como EditableImage/CloudinaryImage que también se renderizan
 * en el sitio público (fuera del admin), donde no hay proveedor.
 */
export function useEditOptional() {
  return useContext(EditContext)
}
