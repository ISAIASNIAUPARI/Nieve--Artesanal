'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Button, DynamicSectionData, HomePageData, LayoutSection, MediaUploadStatus, PageLayout, SectionKey } from '@/lib/types'
import { CONTENT_FILES, PAGE_LAYOUT_FILE, SECTION_LABELS, validateButtons } from '@/lib/types'
import { uploadMediaToCloudinary, type MediaKind } from '@/lib/upload'
import { EditContext, type EditContextValue, type SaveResult } from './EditContext'

// useEdit/useEditOptional viven en ./EditContext (archivo liviano, sin esta
// lógica de guardado/subida) — se re-exportan aquí solo para no romper los
// imports existentes de los componentes EXCLUSIVOS del admin (Toolbar,
// LayoutPanel, NewSectionModal, AdminApp, ButtonsEditor). Cualquier
// componente que TAMBIÉN se renderice en el sitio público debe importarlos
// de './EditContext' directo, nunca de aquí — ver el comentario en ese
// archivo.
export { useEdit, useEditOptional } from './EditContext'

interface SaveFile {
  path: string
  json: unknown
}

type DynamicMap = Record<string, DynamicSectionData>

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
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

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
      viewMode,
      setViewMode,
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
      viewMode,
    ]
  )

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}
