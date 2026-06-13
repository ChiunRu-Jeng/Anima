import type { Metadata } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import KuangHingSite from './KuangHingSite'

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

const scopedCss = `
  #kh-root { scroll-behavior: smooth; }
  #kh-root ::selection { background: #5E7259; color: #fff; }
  #kh-root .kh-nav-desktop { display: flex; }
  #kh-root .kh-nav-burger { display: none; }
  @media (max-width: 920px) {
    #kh-root .kh-nav-desktop { display: none; }
    #kh-root .kh-nav-burger { display: inline-flex; }
    #kh-root .kh-hero-cta-phone { display: none; }
  }
  #kh-root .kh-nav-link:hover { color: #5E7259; border-bottom-color: #5E7259; }
  #kh-root .kh-cta:hover { background: #4C5E48; transform: translateY(-2px); }
  #kh-root .kh-ghost-btn:hover { border-color: #5E7259; color: #5E7259; }
  #kh-root .kh-lift:hover { transform: translateY(-2px); }
  #kh-root .kh-service-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 22px 44px -26px rgba(50,46,41,0.45);
    border-color: rgba(94,114,89,0.4);
  }
  @keyframes kh-fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes kh-softIn { from { opacity: 0; } to { opacity: 1; } }
`

export default function KuangHingPage() {
  return (
    <div id="kh-root" className={`${serifTC.variable} ${sansTC.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <KuangHingSite />
    </div>
  )
}
