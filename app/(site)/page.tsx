import { client } from '@/sanity/lib/client'
import { homePageQuery } from '@/sanity/lib/queries'
import type { HomePageData } from '@/sanity/lib/types'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Flavors from '@/components/Flavors'
import VideoSection from '@/components/VideoSection'
import Location from '@/components/Location'
import Footer from '@/components/Footer'

export const revalidate = 60

export default async function HomePage() {
  const data = await client.fetch<HomePageData>(homePageQuery)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
      <Header siteSettings={data.siteSettings} />
      <Hero data={data.hero} />
      <About data={data.about} />
      <Flavors data={data.flavors} />
      <VideoSection data={data.video} />
      <Location data={data.location} />
      <Footer siteSettings={data.siteSettings} />
    </div>
  )
}
