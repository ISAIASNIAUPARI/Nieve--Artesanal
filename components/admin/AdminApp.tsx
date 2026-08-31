'use client'

import type { HomePageData } from '@/lib/types'
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
  const { content, setField, setImageField } = useEdit()

  return (
    <>
      <Toolbar />
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
        <Header siteSettings={content.siteSettings} edit onChange={(field, value) => setField('siteSettings', field, value)} />
        <Hero
          data={content.hero}
          edit
          onChange={(field, value) => setField('hero', field, value)}
          onImageChange={(field, file) => setImageField('hero', field, file)}
        />
        <About
          data={content.about}
          edit
          onChange={(field, value) => setField('about', field, value)}
          onImageChange={(field, file) => setImageField('about', field, file)}
        />
        <Flavors
          data={content.flavors}
          edit
          onChange={(field, value) => setField('flavors', field, value)}
          onImageChange={(field, file) => setImageField('flavors', field, file)}
        />
        <VideoSection
          data={content.video}
          edit
          onChange={(field, value) => setField('video', field, value)}
          onVideoFile={(file) => setImageField('video', 'video', file)}
        />
        <Location data={content.location} edit onChange={(field, value) => setField('location', field, value)} />
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
