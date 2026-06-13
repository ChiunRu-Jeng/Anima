import type { Metadata } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import './globals.css'

const serifTC = Noto_Serif_TC({
  weight: ['400', '500', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-serif-tc',
  display: 'swap',
  preload: false,
})

const sansTC = Noto_Sans_TC({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans-tc',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: '廣興禮儀公司 — 用愛與尊嚴，圓滿人生的最後一程',
  description:
    '廣興禮儀，三十年深耕高雄美濃。提供全程禮儀服務、生前契約、追思會館與治喪流程協助，以同理心陪伴每一個家庭。24 小時免費諮詢專線 0921-223-518。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${serifTC.variable} ${sansTC.variable}`}>
      <body>{children}</body>
    </html>
  )
}
