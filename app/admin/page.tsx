import { getAllDynamicSections, getHomePageData, getPageLayout, getTheme } from '@/lib/content'
import AdminApp from '@/components/admin/AdminApp'

// El admin nunca debe quedar cacheado como estático: siempre lee el contenido más reciente.
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const data = getHomePageData()
  const layout = getPageLayout()
  const dynamicSections = getAllDynamicSections()
  const theme = getTheme()
  return <AdminApp initialContent={data} initialLayout={layout} initialDynamic={dynamicSections} initialTheme={theme} />
}
