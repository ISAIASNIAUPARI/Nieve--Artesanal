'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type {
  Button,
  DynamicSectionData,
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

type DynamicMap = Record<string, DynamicSectionData>

interface EditContextValue {
  content: HomePageData
  layout: PageLayout
  dynamic: DynamicMap
  isDirty: boolean
  setField: (section: SectionKey, field: string, value: string) => void
  setObjectField: (section: SectionKey, field: string, prop: string, value: string) => void
  setButtons: (section: SectionKey, buttons: Button[]) => void
  setLayoutSections: (sections: LayoutSection[]) => void
  /** Reemplaza el contenido completo de una sección dinámica. */
  setDynamic: (id: string, data: DynamicSectionData) => void
  /** Registra una sección recién creada por /api/admin/create-section (ya commiteada). */
  registerCreatedSection: (id: string, data: DynamicSectionData, layout: LayoutSection[]) => void
  /** Quita una sección recién borrada por /api/admin/delete-section (ya commiteada). */
  unregisterDeletedSection: (id: string, layout: LayoutSection[]) => void
  uploadMedia: (section: SectionKey, field: string, file: File, kind: MediaKind) => Promise<void>
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
  initialDynamic,
  children,
}: {
  initialContent: HomePageData
  initialLayout: PageLayout
  initialDynamic: DynamicMap
  children: React.ReactNode
}) {
  const [content, setContent] = useState<HomePageData>(initialContent)
  const [layout, setLayout] = useState<PageLayout>(initialLayout)
  const [dynamic, setDynamicMap] = useState<DynamicMap>(initialDynamic)
  const [dirtySections, setDirtySections] = useState<Set<SectionKey>>(new Set())
  const [dirtyDynamic, setDirtyDynamic] = useState<Set<string>>(new Set())
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
        return { ...prev, [section]: { ...prev[section], [field]: { ...current, [prop]: value } } }
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

  const setDynamic = useCallback((id: string, data: DynamicSectionData) => {
    setDynamicMap((prev) => ({ ...prev, [id]: data }))
    setDirtyDynamic((prev) => new Set(prev).add(id))
    setLastSaved(null)
  }, [])

  const registerCreatedSection = useCallback(
    (id: string, data: DynamicSectionData, nextLayout: LayoutSection[]) => {
      setDynamicMap((prev) => ({ ...prev, [id]: data }))
      setLayout({ sections: nextLayout })
      setLayoutDirty(false) // create-section ya commiteó pageLayout.json
      setLastSaved(null)
    },
    []
  )

  const unregisterDeletedSection = useCallback((id: string, nextLayout: LayoutSection[]) => {
    setDynamicMap((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setDirtyDynamic((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setLayout({ sections: nextLayout })
    setLayoutDirty(false)
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
    if (dirtySections.size === 0 && dirtyDynamic.size === 0 && !layoutDirty) return

    // Validación de botones antes de guardar.
    for (const key of dirtySections) {
      const err = validateButtons((content[key] as { buttons?: Button[] }).buttons, SECTION_LABELS[key])
      if (err) return setSaveError(err)
    }
    for (const id of dirtyDynamic) {
      const d = dynamic[id]
      if (d?.type === 'cta-banner') {
        const err = validateButtons(d.buttons, 'Banner', 2)
        if (err) return setSaveError(err)
      }
    }

    setSaving(true)
    setSaveError(null)
    try {
      const files: SaveFile[] = Array.from(dirtySections).map((key) => ({
        path: `content/${CONTENT_FILES[key]}`,
        json: content[key],
      }))
      for (const id of dirtyDynamic) {
        files.push({ path: `content/sections/${id}.json`, json: dynamic[id] })
      }
      if (layoutDirty) {
        files.push({ path: `content/${PAGE_LAYOUT_FILE}`, json: layout })
      }

      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: files }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar.')

      setDirtySections(new Set())
      setDirtyDynamic(new Set())
      setLayoutDirty(false)
      setLastSaved({ sha: data.sha, htmlUrl: data.htmlUrl })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido al guardar.')
    } finally {
      setSaving(false)
    }
  }, [content, dirtySections, dynamic, dirtyDynamic, layout, layoutDirty])

  const value = useMemo<EditContextValue>(
    () => ({
      content,
      layout,
      dynamic,
      isDirty: dirtySections.size > 0 || dirtyDynamic.size > 0 || layoutDirty,
      setField,
      setObjectField,
      setButtons,
      setLayoutSections,
      setDynamic,
      registerCreatedSection,
      unregisterDeletedSection,
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
      dynamic,
      dirtySections,
      dirtyDynamic,
      layoutDirty,
      setField,
      setObjectField,
      setButtons,
      setLayoutSections,
      setDynamic,
      registerCreatedSection,
      unregisterDeletedSection,
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
