'use client'

import type {
  BaseSectionId,
  DynamicSectionData,
  HomePageData,
  MediaUploadStatus,
  PageLayout,
  SectionKey,
} from '@/lib/types'
import { isBaseSectionId } from '@/lib/types'
import { EditProvider, useEdit } from './EditProvider'
import Toolbar from './Toolbar'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Flavors from '@/components/Flavors'
import VideoSection from '@/components/VideoSection'
import Location from '@/components/Location'
import Footer from '@/components/Footer'
import DynamicSection from '@/components/sections/DynamicSection'

function AdminSite() {
  const { content, layout, dynamic, setField, setButtons, setFocal, setDynamic, uploadMedia, uploads } = useEdit()

  // uploads viene con claves `${section}.${field}`; cada componente quiere solo su sección.
  const sectionUploads = (section: SectionKey): Record<string, MediaUploadStatus> => {
    const prefix = `${section}.`
    return Object.fromEntries(
      Object.entries(uploads)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => [k.slice(prefix.length), v])
    )
  }

  const editors: Record<BaseSectionId, React.ReactNode> = {
    hero: (
      <Hero
        data={content.hero}
        edit
        onChange={(field, value) => setField('hero', field, value)}
        onButtonsChange={(buttons) => setButtons('hero', buttons)}
        onImageChange={(field, file) => uploadMedia('hero', field, file, 'image')}
        onFocalChange={(field, x, y) => setFocal('hero', field, x, y)}
        uploads={sectionUploads('hero')}
      />
    ),
    about: (
      <About
        data={content.about}
        edit
        onChange={(field, value) => setField('about', field, value)}
        onButtonsChange={(buttons) => setButtons('about', buttons)}
        onImageChange={(field, file) => uploadMedia('about', field, file, 'image')}
        onFocalChange={(field, x, y) => setFocal('about', field, x, y)}
        uploads={sectionUploads('about')}
      />
    ),
    flavors: (
      <Flavors
        data={content.flavors}
        edit
        onChange={(field, value) => setField('flavors', field, value)}
        onButtonsChange={(buttons) => setButtons('flavors', buttons)}
        onImageChange={(field, file) => uploadMedia('flavors', field, file, 'image')}
        onFocalChange={(field, x, y) => setFocal('flavors', field, x, y)}
        uploads={sectionUploads('flavors')}
      />
    ),
    video: (
      <VideoSection
        data={content.video}
        edit
        onChange={(field, value) => setField('video', field, value)}
        onButtonsChange={(buttons) => setButtons('video', buttons)}
        onVideoFile={(file) => uploadMedia('video', 'video', file, 'video')}
        upload={uploads['video.video']}
      />
    ),
    location: (
      <Location
        data={content.location}
        edit
        onChange={(field, value) => setField('location', field, value)}
        onButtonsChange={(buttons) => setButtons('location', buttons)}
      />
    ),
  }

  return (
    <>
      <Toolbar />
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
        <Header
          siteSettings={content.siteSettings}
          sections={layout.sections}
          edit
          onChange={(field, value) => setField('siteSettings', field, value)}
        />
        {layout.sections.map((s) => {
          let body: React.ReactNode = null
          if (isBaseSectionId(s.id)) {
            body = editors[s.id]
          } else {
            const d = dynamic[s.id]
            body = d ? (
              <DynamicSection
                id={s.id}
                data={d}
                edit
                onChange={(next: DynamicSectionData | ((prev: DynamicSectionData) => DynamicSectionData)) => setDynamic(s.id, next)}
              />
            ) : (
              <div style={{ padding: '40px 6vw', color: 'var(--ink-soft)', fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
                «{s.label}» se está creando… recarga en ~1 min cuando Vercel termine de desplegar.
              </div>
            )
          }
          return (
            <div key={s.id} style={{ position: 'relative' }}>
              {!s.visible && (
                <div
                  style={{
                    padding: '8px 6vw',
                    background: '#f5c25a',
                    color: '#1c1310',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  🚫 «{s.label}» está oculta en el sitio público — la puedes seguir editando aquí.
                </div>
              )}
              <div style={{ opacity: s.visible ? 1 : 0.5 }}>{body}</div>
            </div>
          )
        })}
        <Footer siteSettings={content.siteSettings} edit onChange={(field, value) => setField('siteSettings', field, value)} />
      </div>
    </>
  )
}

export default function AdminApp({
  initialContent,
  initialLayout,
  initialDynamic,
}: {
  initialContent: HomePageData
  initialLayout: PageLayout
  initialDynamic: Record<string, DynamicSectionData>
}) {
  return (
    <EditProvider initialContent={initialContent} initialLayout={initialLayout} initialDynamic={initialDynamic}>
      <AdminSite />
    </EditProvider>
  )
}
