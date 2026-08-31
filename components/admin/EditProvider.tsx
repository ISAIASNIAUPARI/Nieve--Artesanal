'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { HomePageData, SectionKey } from '@/lib/types'
import { CONTENT_FILES } from '@/lib/types'

interface PendingImage {
  section: SectionKey
  field: string
  file: File
  objectUrl: string
}

interface SaveResult {
  sha: string
  htmlUrl: string
}

interface EditContextValue {
  content: HomePageData
  isDirty: boolean
  setField: <S extends SectionKey>(section: S, field: string, value: string) => void
  setImageField: (section: SectionKey, field: string, file: File) => void
  saving: boolean
  saveError: string | null
  lastSaved: SaveResult | null
  save: () => Promise<void>
}

const EditContext = createContext<EditContextValue | null>(null)

function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  if (file.type.includes('/')) return file.type.split('/')[1]
  return 'bin'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:image/png;base64,AAAA..." -> nos quedamos solo con la parte base64
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function EditProvider({ initialContent, children }: { initialContent: HomePageData; children: React.ReactNode }) {
  const [content, setContent] = useState<HomePageData>(initialContent)
  const [dirtySections, setDirtySections] = useState<Set<SectionKey>>(new Set())
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<SaveResult | null>(null)

  const setField = useCallback(<S extends SectionKey>(section: S, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
    setDirtySections((prev) => new Set(prev).add(section))
    setLastSaved(null)
  }, [])

  const setImageField = useCallback((section: SectionKey, field: string, file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setContent((prev) => {
      const currentField = (prev[section] as any)[field] || {}
      return {
        ...prev,
        [section]: { ...prev[section], [field]: { ...currentField, src: objectUrl } },
      }
    })
    setPendingImages((prev) => [...prev.filter((p) => !(p.section === section && p.field === field)), { section, field, file, objectUrl }])
    setDirtySections((prev) => new Set(prev).add(section))
    setLastSaved(null)
  }, [])

  const save = useCallback(async () => {
    if (dirtySections.size === 0 && pendingImages.length === 0) return
    setSaving(true)
    setSaveError(null)
    try {
      // 1) Sube las imágenes pendientes a rutas finales dentro de /public/images/uploads
      //    y reescribe su `src` en el contenido para que apunte ahí (no al objectURL local).
      const finalContent: HomePageData = JSON.parse(JSON.stringify(content))
      const images: { path: string; base64: string }[] = []

      for (const pending of pendingImages) {
        const ext = fileExtension(pending.file)
        const safeName = `${pending.section}-${pending.field}-${Date.now()}.${ext}`.toLowerCase()
        const publicPath = `/images/uploads/${safeName}`
        const repoPath = `public/images/uploads/${safeName}`
        const base64 = await fileToBase64(pending.file)
        images.push({ path: repoPath, base64 })
        ;(finalContent[pending.section] as any)[pending.field] = {
          ...(finalContent[pending.section] as any)[pending.field],
          src: publicPath,
        }
      }

      const sections = Array.from(dirtySections).map((key) => ({
        path: `content/${CONTENT_FILES[key]}`,
        json: finalContent[key],
      }))

      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, images }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar.')
      }

      setContent(finalContent)
      setDirtySections(new Set())
      pendingImages.forEach((p) => URL.revokeObjectURL(p.objectUrl))
      setPendingImages([])
      setLastSaved({ sha: data.sha, htmlUrl: data.htmlUrl })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido al guardar.')
    } finally {
      setSaving(false)
    }
  }, [content, dirtySections, pendingImages])

  const value = useMemo<EditContextValue>(
    () => ({
      content,
      isDirty: dirtySections.size > 0 || pendingImages.length > 0,
      setField,
      setImageField,
      saving,
      saveError,
      lastSaved,
      save,
    }),
    [content, dirtySections, pendingImages, setField, setImageField, saving, saveError, lastSaved, save]
  )

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEdit() {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error('useEdit debe usarse dentro de <EditProvider>')
  return ctx
}
