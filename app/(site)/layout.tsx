import { DM_Serif_Display, Work_Sans } from 'next/font/google'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
  display: 'swap',
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={`site ${dmSerifDisplay.variable} ${workSans.variable}`}>{children}</div>
}
