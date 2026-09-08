'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { HomePageData, MediaUploadStatus, SectionKey } from '@/lib/types'
import { CONTENT_FILES } from '@/lib/types'
import { uploadMediaToCloudinary, type MediaKind } from '@/lib/upload'

interface SaveResult {
  sha: string
  htmlUrl: string
}

interface EditContextValue {
  content: HomePageData
  isDirty: boolean
  /** Edita un campo de texto de primer nivel de una sección. */
  setField: (section: SectionKey, field: string, value: string) => void
  /** Edita una propiedad anidada de un objeto (ej. un botón: { text, href }). */
  setObjectField: (section: SectionKey, field: string, prop: string, value: string) => void
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

export function EditProvider({ initialContent, children }: { initialContent: HomePageData; children: React.ReactNode }) {
  const [content, setContent] = useState<HomePageData>(initialContent)
  const [dirtySections, setDirtySections] = useState<Set<SectionKey>>(new Set())
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
    if (dirtySections.size === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      const sections = Array.from(dirtySections).map((key) => ({
        path: `content/${CONTENT_FILES[key]}`,
        json: content[key],
      }))

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
      setLastSaved({ sha: data.sha, htmlUrl: data.htmlUrl })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido al guardar.')
    } finally {
      setSaving(false)
    }
  }, [content, dirtySections])

  const value = useMemo<EditContextValue>(
    () => ({
      content,
      isDirty: dirtySections.size > 0,
      setField,
      setObjectField,
      uploadMedia,
      uploads,
      saving,
      saveError,
      lastSaved,
      save,
    }),
    [content, dirtySections, setField, setObjectField, uploadMedia, uploads, saving, saveError, lastSaved, save]
  )

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEdit() {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEdit debe usarse dentro de <EditProvider>')
  return ctx
}
