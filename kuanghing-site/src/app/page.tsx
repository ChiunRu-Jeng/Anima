import KuangHingSite from './KuangHingSite'

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

export default function Home() {
  return (
    <div id="kh-root">
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <KuangHingSite />
    </div>
  )
}
