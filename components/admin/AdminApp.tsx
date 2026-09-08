'use client'

import type { BaseSectionId, HomePageData, MediaUploadStatus, PageLayout, SectionKey } from '@/lib/types'
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

function AdminSite() {
  const { content, layout, setField, setButtons, uploadMedia, uploads } = useEdit()

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
          if (!isBaseSectionId(s.id)) return null
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
              <div style={{ opacity: s.visible ? 1 : 0.5 }}>{editors[s.id]}</div>
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
}: {
  initialContent: HomePageData
  initialLayout: PageLayout
}) {
  return (
    <EditProvider initialContent={initialContent} initialLayout={initialLayout}>
      <AdminSite />
    </EditProvider>
  )
}
