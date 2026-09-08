import { getDynamicSection, getHomePageData, getPageLayout } from '@/lib/content'
import { isBaseSectionId, type BaseSectionId } from '@/lib/types'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Flavors from '@/components/Flavors'
import VideoSection from '@/components/VideoSection'
import Location from '@/components/Location'
import Footer from '@/components/Footer'
import DynamicSection from '@/components/sections/DynamicSection'

export default function HomePage() {
  const data = getHomePageData()
  const layout = getPageLayout()

  const baseSections: Record<BaseSectionId, React.ReactNode> = {
    hero: <Hero data={data.hero} />,
    about: <About data={data.about} />,
    flavors: <Flavors data={data.flavors} />,
    video: <VideoSection data={data.video} />,
    location: <Location data={data.location} />,
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>
      <Header siteSettings={data.siteSettings} sections={layout.sections} />
      {layout.sections
        .filter((s) => s.visible)
        .map((s) => {
          if (isBaseSectionId(s.id)) return <div key={s.id}>{baseSections[s.id]}</div>
          const dynamic = getDynamicSection(s.id)
          if (!dynamic) return null
          return <DynamicSection key={s.id} id={s.id} data={dynamic} />
        })}
      <Footer siteSettings={data.siteSettings} />
    </div>
  )
}
