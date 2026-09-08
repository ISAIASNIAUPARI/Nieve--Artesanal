'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type {
  Button,
  HomePageData,
  LayoutSection,
  MediaUploadStatus,
  PageLayout,
  SectionKey,
} from '@/lib/types'
import { CONTENT_FILES, PAGE_LAYOUT_FILE, SECTION_LABELS, validateButtons } from '@/lib/types'
import { uploadMediaToCloudinary, type MediaKind } from '@/lib/upload'

interface SaveResult {
  sha: string
  htmlUrl: string
}

interface SaveFile {
  path: string
  json: unknown
}

interface EditContextValue {
  content: HomePageData
  layout: PageLayout
  isDirty: boolean
  /** Edita un campo de texto de primer nivel de una sección. */
  setField: (section: SectionKey, field: string, value: string) => void
  /** Edita una propiedad anidada de un objeto (ej. una imagen: { src, alt }). */
  setObjectField: (section: SectionKey, field: string, prop: string, value: string) => void
  /** Reemplaza el array de botones de una sección (añadir / borrar / reordenar / editar). */
  setButtons: (section: SectionKey, buttons: Button[]) => void
  /** Reemplaza el orden / visibilidad de las secciones de la página. */
  setLayoutSections: (sections: LayoutSection[]) => void
  /** Sube una imagen o video a Cloudinary y guarda su URL en el campo indicado. */
  uploadMedia: (section: SectionKey, field: string, file: File, kind: MediaKind) => Promise<void>
  /** Subidas en curso, por clave `${section}.${field}`. */
  uploads: Record<string, MediaUploadStatus>
  saving: boolean
  saveError: string | null
  lastSaved: SaveResult | null
  save: () => Promise<void>
}

const EditContext = createContext<EditContextValue | null>(null)

export function EditProvider({
  initialContent,
  initialLayout,
  children,
}: {
  initialContent: HomePageData
  initialLayout: PageLayout
  children: React.ReactNode
}) {
  const [content, setContent] = useState<HomePageData>(initialContent)
  const [layout, setLayout] = useState<PageLayout>(initialLayout)
  const [dirtySections, setDirtySections] = useState<Set<SectionKey>>(new Set())
  const [layoutDirty, setLayoutDirty] = useState(false)
  const [uploads, setUploads] = useState<Record<string, MediaUploadStatus>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<SaveResult | null>(null)

  const markDirty = useCallback((section: SectionKey) => {
    setDirtySections((prev) => new Set(prev).add(section))
    setLastSaved(null)
  }, [])

  const setField = useCallback(
    (section: SectionKey, field: string, value: string) => {
      setContent((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
      markDirty(section)
    },
    [markDirty]
  )

  const setObjectField = useCallback(
    (section: SectionKey, field: string, prop: string, value: string) => {
      setContent((prev) => {
        const current = ((prev[section] as Record<string, unknown>)[field] as Record<string, unknown>) || {}
        return {
          ...prev,
          [section]: { ...prev[section], [field]: { ...current, [prop]: value } },
        }
      })
      markDirty(section)
    },
    [markDirty]
  )

  const setButtons = useCallback(
    (section: SectionKey, buttons: Button[]) => {
      setContent((prev) => ({ ...prev, [section]: { ...prev[section], buttons } }))
      markDirty(section)
    },
    [markDirty]
  )

  const setLayoutSections = useCallback((sections: LayoutSection[]) => {
    setLayout({ sections })
    setLayoutDirty(true)
    setLastSaved(null)
  }, [])

  const uploadMedia = useCallback(
    async (section: SectionKey, field: string, file: File, kind: MediaKind) => {
      const key = `${section}.${field}`
      setUploads((prev) => ({ ...prev, [key]: { pct: 0, error: null } }))
      try {
        const url = await uploadMediaToCloudinary(file, kind, (pct) => {
          setUploads((prev) => ({ ...prev, [key]: { pct, error: null } }))
        })
        setContent((prev) => {
          const current = ((prev[section] as Record<string, unknown>)[field] as Record<string, unknown>) || {}
          return { ...prev, [section]: { ...prev[section], [field]: { ...current, src: url } } }
        })
        markDirty(section)
        setUploads((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } catch (err) {
        setUploads((prev) => ({
          ...prev,
          [key]: { pct: 0, error: err instanceof Error ? err.message : 'Error al subir el archivo.' },
        }))
      }
    },
    [markDirty]
  )

  const save = useCallback(async () => {
    if (dirtySections.size === 0 && !layoutDirty) return

    // Validación antes de guardar: botones con texto y destino válidos, máx. 5.
    for (const key of dirtySections) {
      const err = validateButtons((content[key] as { buttons?: Button[] }).buttons, SECTION_LABELS[key])
      if (err) {
        setSaveError(err)
        return
      }
    }

    setSaving(true)
    setSaveError(null)
    try {
      const sections: SaveFile[] = Array.from(dirtySections).map((key) => ({
        path: `content/${CONTENT_FILES[key]}`,
        json: content[key],
      }))
      if (layoutDirty) {
        sections.push({ path: `content/${PAGE_LAYOUT_FILE}`, json: layout })
      }

      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar.')
      }

      setDirtySections(new Set())
      setLayoutDirty(false)
      setLastSaved({ sha: data.sha, htmlUrl: data.htmlUrl })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido al guardar.')
    } finally {
      setSaving(false)
    }
  }, [content, dirtySections, layout, layoutDirty])

  const value = useMemo<EditContextValue>(
    () => ({
      content,
      layout,
      isDirty: dirtySections.size > 0 || layoutDirty,
      setField,
      setObjectField,
      setButtons,
      setLayoutSections,
      uploadMedia,
      uploads,
      saving,
      saveError,
      lastSaved,
      save,
    }),
    [
      content,
      layout,
      dirtySections,
      layoutDirty,
      setField,
      setObjectField,
      setButtons,
      setLayoutSections,
      uploadMedia,
      uploads,
      saving,
      saveError,
      lastSaved,
      save,
    ]
  )

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEdit() {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEdit debe usarse dentro de <EditProvider>')
  return ctx
}
