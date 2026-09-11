'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
  /** Guarda el punto focal (0-100, 0-100) de una imagen de una sección base. */
  setFocal: (section: SectionKey, field: string, x: number, y: number) => void
  setLayoutSections: (sections: LayoutSection[]) => void
  /**
   * Reemplaza el contenido de una sección dinámica. Acepta un valor o, mejor, un
   * actualizador `(prev) => next` — así la actualización parte siempre del estado
   * más reciente en vez de un `data` capturado en el cierre del componente, que
   * puede quedar desactualizado si dos ediciones (ej. dos fotos de una galería)
   * ocurren antes de que React vuelva a renderizar entre una y otra.
   */
  setDynamic: (id: string, updater: DynamicSectionData | ((prev: DynamicSectionData) => DynamicSectionData)) => void
  /** Registra una sección recién creada por /api/admin/create-section (ya commiteada). */
  registerCreatedSection: (id: string, data: DynamicSectionData, layout: LayoutSection[]) => void
  /** Quita una sección recién borrada por /api/admin/delete-section (ya commiteada). */
  unregisterDeletedSection: (id: string, layout: LayoutSection[]) => void
  /** Devuelve true si la subida terminó bien (false si falló) — para abrir el punto focal tras soltar un archivo. */
  uploadMedia: (section: SectionKey, field: string, file: File, kind: MediaKind) => Promise<boolean>
  uploads: Record<string, MediaUploadStatus>
  /**
   * Tipo del archivo que el usuario está arrastrando sobre la página del admin
   * ('image' | 'video' | null) — para resaltar solo los contenedores que lo aceptan.
   * null también cuando el navegador no expone el tipo todavía o es de otro tipo;
   * en ese caso no se resalta nada y el contenedor que reciba el drop muestra su
   * propio error al soltar.
   */
  isDraggingFile: 'image' | 'video' | null
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
  const [isDraggingFile, setIsDraggingFile] = useState<'image' | 'video' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<SaveResult | null>(null)

  // Arrastrar un archivo sobre la página del admin: marca isDraggingFile con el tipo
  // detectado (para pintar solo los contenedores que lo aceptan) y evita que el
  // navegador lo abra si se suelta fuera de uno de ellos. Cuenta entradas/salidas
  // porque dragenter/dragleave burbujean por cada hijo que el cursor cruza — el
  // contador solo llega a 0 al salir de verdad.
  useEffect(() => {
    let depth = 0

    const kindOf = (e: DragEvent): 'image' | 'video' | null => {
      const type = e.dataTransfer?.items?.[0]?.type
      if (!type) return null
      if (type.startsWith('image/')) return 'image'
      if (type.startsWith('video/')) return 'video'
      return null
    }

    const onDragEnter = (e: DragEvent) => {
      depth++
      if (depth === 1) setIsDraggingFile(kindOf(e))
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setIsDraggingFile(null)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setIsDraggingFile(null)
    }

    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
    }
  }, [])

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

  const setFocal = useCallback(
    (section: SectionKey, field: string, x: number, y: number) => {
      setContent((prev) => {
        const current = ((prev[section] as Record<string, unknown>)[field] as Record<string, unknown>) || {}
        return { ...prev, [section]: { ...prev[section], [field]: { ...current, focalX: x, focalY: y } } }
      })
      markDirty(section)
    },
    [markDirty]
  )

  const setLayoutSections = useCallback((sections: LayoutSection[]) => {
    setLayout({ sections })
    setLayoutDirty(true)
    setLastSaved(null)
  }, [])

  const setDynamic = useCallback(
    (id: string, updater: DynamicSectionData | ((prev: DynamicSectionData) => DynamicSectionData)) => {
      setDynamicMap((prev) => {
        const current = prev[id]
        const next = typeof updater === 'function' ? (updater as (p: DynamicSectionData) => DynamicSectionData)(current) : updater
        return { ...prev, [id]: next }
      })
      setDirtyDynamic((prev) => new Set(prev).add(id))
      setLastSaved(null)
    },
    []
  )

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
        return true
      } catch (err) {
        setUploads((prev) => ({
          ...prev,
          [key]: { pct: 0, error: err instanceof Error ? err.message : 'Error al subir el archivo.' },
        }))
        return false
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
      setFocal,
      setLayoutSections,
      setDynamic,
      registerCreatedSection,
      unregisterDeletedSection,
      uploadMedia,
      uploads,
      isDraggingFile,
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
      setFocal,
      setLayoutSections,
      setDynamic,
      registerCreatedSection,
      unregisterDeletedSection,
      uploadMedia,
      uploads,
      isDraggingFile,
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

/**
 * Igual que useEdit() pero devuelve null en vez de lanzar cuando no hay <EditProvider>
 * — para componentes como EditableImage/CloudinaryImage que también se renderizan
 * en el sitio público (fuera del admin), donde no hay proveedor.
 */
export function useEditOptional() {
  return useContext(EditContext)
}
