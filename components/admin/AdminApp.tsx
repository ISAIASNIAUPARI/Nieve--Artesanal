'use client'

import type { HomePageData, MediaUploadStatus, SectionKey } from '@/lib/types'
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
  const { content, setField, setButtons, uploadMedia, uploads } = useEdit()

  // uploads viene con claves `${section}.${field}`; cada componente quiere solo su sección.
  const sectionUploads = (section: SectionKey): Record<string, MediaUploadStatus> => {
    const prefix = `${section}.`
    return Object.fromEntries(
      Object.entries(uploads)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => [k.slice(prefix.length), v])
    )
  }

  return (
    <>
      <Toolbar />
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
        <Header siteSettings={content.siteSettings} edit onChange={(field, value) => setField('siteSettings', field, value)} />
        <Hero
          data={content.hero}
          edit
          onChange={(field, value) => setField('hero', field, value)}
          onButtonsChange={(buttons) => setButtons('hero', buttons)}
          onImageChange={(field, file) => uploadMedia('hero', field, file, 'image')}
          uploads={sectionUploads('hero')}
        />
        <About
          data={content.about}
          edit
          onChange={(field, value) => setField('about', field, value)}
          onButtonsChange={(buttons) => setButtons('about', buttons)}
          onImageChange={(field, file) => uploadMedia('about', field, file, 'image')}
          uploads={sectionUploads('about')}
        />
        <Flavors
          data={content.flavors}
          edit
          onChange={(field, value) => setField('flavors', field, value)}
          onButtonsChange={(buttons) => setButtons('flavors', buttons)}
          onImageChange={(field, file) => uploadMedia('flavors', field, file, 'image')}
          uploads={sectionUploads('flavors')}
        />
        <VideoSection
          data={content.video}
          edit
          onChange={(field, value) => setField('video', field, value)}
          onButtonsChange={(buttons) => setButtons('video', buttons)}
          onVideoFile={(file) => uploadMedia('video', 'video', file, 'video')}
          upload={uploads['video.video']}
        />
        <Location
          data={content.location}
          edit
          onChange={(field, value) => setField('location', field, value)}
          onButtonsChange={(buttons) => setButtons('location', buttons)}
        />
        <Footer siteSettings={content.siteSettings} edit onChange={(field, value) => setField('siteSettings', field, value)} />
      </div>
    </>
  )
}

export default function AdminApp({ initialContent }: { initialContent: HomePageData }) {
  return (
    <EditProvider initialContent={initialContent}>
      <AdminSite />
    </EditProvider>
  )
}
