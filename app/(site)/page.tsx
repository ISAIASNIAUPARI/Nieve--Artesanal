import { getHomePageData } from '@/lib/content'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Flavors from '@/components/Flavors'
import VideoSection from '@/components/VideoSection'
import Location from '@/components/Location'
import Footer from '@/components/Footer'

export default function HomePage() {
  const data = getHomePageData()

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
