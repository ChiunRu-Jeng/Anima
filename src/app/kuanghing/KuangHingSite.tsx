'use client'

import { useState } from 'react'
import ImageSlot from './ImageSlot'

const SERIF = "var(--font-serif-tc), 'Noto Serif TC', serif"
const SANS = "var(--font-sans-tc), 'Noto Sans TC', sans-serif"

const navItems = [
  { label: '服務介紹', href: '#services' },
  { label: '生前契約', href: '#contract' },
  { label: '追思會館', href: '#hall' },
  { label: '治喪流程', href: '#process' },
  { label: '關於我們', href: '#about' },
  { label: '聯絡我們', href: '#contact' },
]

const values = [
  { stat: '30＋', title: '年專業經驗', desc: '深耕美濃在地服務' },
  { stat: '24h', title: '全天候待命', desc: '緊急需求即時回應' },
  { stat: '全程', title: '一條龍服務', desc: '接體到後續關懷' },
  { stat: '用心', title: '同理心陪伴', desc: '傾聽每個家庭需求' },
]

const services = [
  { icon: '🕊', title: '遺體接運安置', desc: '24小時到府接體，妥善安置，協助辦理初步必要事宜。' },
  { icon: '📋', title: '治喪協調文書', desc: '協助死亡證明、除戶、申辦補助等繁瑣文書與流程。' },
  { icon: '🪷', title: '會場布置司儀', desc: '莊嚴典雅的靈堂與告別式布置，專業司儀引導奠禮。' },
  { icon: '📿', title: '法事誦經科儀', desc: '依宗教信仰安排做七、誦經、超薦等傳統科儀。' },
  { icon: '⚱', title: '火化晉塔安厝', desc: '協調火化、進塔或安葬事宜，圓滿安奉摯愛。' },
  { icon: '🤲', title: '後續關懷服務', desc: '對年、合爐、祭祀提醒，持續陪伴家屬走出傷痛。' },
]

const contractPoints = [
  { title: '預先規劃，從容安心', desc: '依自己的心願安排，避免臨時倉促。' },
  { title: '減輕家人負擔', desc: '在悲傷時刻，家人不必為費用與細節煩惱。' },
  { title: '價格透明固定', desc: '簽約價格鎖定，免受未來物價波動影響。' },
  { title: '履約保障', desc: '依法信託專戶保管，履約有保障。' },
]

const hallFeatures = [
  { title: '莊嚴禮廳', desc: '素雅布置與柔和燈光' },
  { title: '家屬休息室', desc: '舒適安靜的陪伴空間' },
  { title: '花藝布置', desc: '細緻溫暖的告別氛圍' },
  { title: '停車便利', desc: '親友前來無負擔' },
]

const steps = [
  { num: '壹', title: '緊急聯繫 · 到府接體', desc: '撥打24小時專線，專人即刻前往，協助接運與安置。' },
  { num: '貳', title: '治喪協調會議', desc: '與家屬討論宗教儀式、日期、預算與整體規劃。' },
  { num: '參', title: '入殮安靈', desc: '為亡者淨身、著裝、入殮，設置靈堂安奉。' },
  { num: '肆', title: '做七法事', desc: '依信仰安排誦經、做七等科儀，慎終追遠。' },
  { num: '伍', title: '告別奠禮', desc: '莊嚴隆重的告別式，讓親友獻上最後思念。' },
  { num: '陸', title: '火化晉塔 · 後續關懷', desc: '協助火化、進塔安奉，並提供對年合爐等後續服務。' },
]

const aboutValues = [
  { title: '尊重', desc: '敬重每一個生命的故事' },
  { title: '誠信', desc: '費用透明，誠實以對' },
  { title: '陪伴', desc: '用同理心守護家屬' },
]

const topics = ['全程禮儀服務', '生前契約', '追思會館租借', '治喪流程諮詢', '其他需求']

const SECTION_PAD = 'clamp(60px, 8vw, 100px) clamp(20px, 4vw, 48px)'

export default function KuangHingSite() {
  const [navOpen, setNavOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', topic: topics[0], message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  const closeNav = () => setNavOpen(false)
  const setField = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setError('')
  }

  const submitForm = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('請填寫您的稱呼與聯絡電話，我們才能盡快與您聯繫。')
      setTouched(true)
      return
    }
    if (!/[0-9]{6,}/.test(form.phone.replace(/[^0-9]/g, ''))) {
      setError('請輸入正確的聯絡電話號碼。')
      setTouched(true)
      return
    }
    setSubmitted(true)
    setError('')
  }

  const resetForm = () => {
    setSubmitted(false)
    setForm({ name: '', phone: '', topic: topics[0], message: '' })
    setError('')
    setTouched(false)
  }

  const invalid = (v: string) => touched && !v.trim()
  const nameBorder = invalid(form.name) ? '#B05A4A' : 'rgba(50,46,41,0.16)'
  const phoneBorder = invalid(form.phone) ? '#B05A4A' : 'rgba(50,46,41,0.16)'

  return (
    <div
      style={{
        fontFamily: SANS,
        color: '#322E29',
        background: '#F6F1E9',
        minHeight: '100vh',
        overflowX: 'hidden',
        lineHeight: 1.7,
      }}
    >
      {/* ============ HEADER ============ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(246,241,233,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(50,46,41,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 48px)',
            height: 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#5E7259',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: '#F6F1E9', lineHeight: 1 }}>廣</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: '#2E2A26' }}>廣興禮儀</span>
              <span style={{ fontSize: 11, letterSpacing: 3, color: '#8A8175' }}>KUANG HING FUNERAL</span>
            </span>
          </a>

          <nav className="kh-nav-desktop" style={{ alignItems: 'center', gap: 'clamp(14px, 2vw, 30px)' }}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="kh-nav-link"
                style={{
                  textDecoration: 'none',
                  color: '#4A4540',
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: 1,
                  padding: '6px 0',
                  whiteSpace: 'nowrap',
                  borderBottom: '2px solid transparent',
                  transition: 'color .2s, border-color .2s',
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a
              className="kh-hero-cta-phone kh-cta"
              href="tel:0921223518"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: '#5E7259',
                color: '#F6F1E9',
                padding: '11px 20px',
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: 1,
                boxShadow: '0 6px 18px rgba(94,114,89,0.28)',
                transition: 'background .2s, transform .2s',
              }}
            >
              <span style={{ width: 16, height: 16, display: 'inline-block' }}>☎</span>
              0921-223-518
            </a>
            <button
              className="kh-nav-burger"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="選單"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <span style={{ width: 24, height: 2, background: '#322E29', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 24, height: 2, background: '#322E29', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 24, height: 2, background: '#322E29', borderRadius: 2, display: 'block' }} />
            </button>
          </div>
        </div>

        {/* mobile drawer */}
        {navOpen && (
          <div style={{ borderTop: '1px solid rgba(50,46,41,0.08)', background: '#F6F1E9', animation: 'kh-softIn .2s ease' }}>
            <nav
              style={{
                maxWidth: 1240,
                margin: '0 auto',
                padding: '12px clamp(20px, 4vw, 48px) 22px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeNav}
                  style={{
                    textDecoration: 'none',
                    color: '#3A352F',
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: 1,
                    padding: '13px 4px',
                    borderBottom: '1px solid rgba(50,46,41,0.06)',
                  }}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="tel:0921223518"
                onClick={closeNav}
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  textDecoration: 'none',
                  background: '#5E7259',
                  color: '#F6F1E9',
                  padding: 13,
                  borderRadius: 999,
                  fontWeight: 500,
                  letterSpacing: 1,
                }}
              >
                ☎ 24小時免費專線 0921-223-518
              </a>
            </nav>
          </div>
        )}
      </header>

      <span id="top" />

      {/* ============ HERO ============ */}
      <section
        style={{
          position: 'relative',
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(48px, 7vw, 92px) clamp(20px, 4vw, 48px)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'clamp(32px, 5vw, 64px)',
        }}
      >
        <div style={{ flex: '1 1 420px', minWidth: 300 }}>
          <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#5E7259', fontWeight: 500, marginBottom: 22 }}>
            三十年深耕 · 在地美濃
          </span>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 'clamp(34px, 5vw, 58px)',
              lineHeight: 1.32,
              letterSpacing: 2,
              margin: '0 0 26px',
              color: '#2A2622',
            }}
          >
            用愛與尊嚴
            <br />
            圓滿人生的最後一程
          </h1>
          <p style={{ fontSize: 'clamp(16px, 1.4vw, 18px)', color: '#6A6258', maxWidth: '30em', margin: '0 0 36px' }}>
            悲傷的時刻，您並不孤單。我們以同理心陪伴每一個家庭，在最艱難的日子裡，協助您莊嚴、圓滿地送別摯愛的親人。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <a
              href="#contact"
              className="kh-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                background: '#5E7259',
                color: '#F6F1E9',
                padding: '15px 30px',
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 16,
                letterSpacing: 1,
                boxShadow: '0 10px 26px rgba(94,114,89,0.30)',
                transition: 'background .2s, transform .2s',
              }}
            >
              免費諮詢服務
            </a>
            <a
              href="#services"
              className="kh-ghost-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                background: 'transparent',
                color: '#4A4540',
                padding: '15px 30px',
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 16,
                letterSpacing: 1,
                border: '1.5px solid rgba(50,46,41,0.18)',
                transition: 'border-color .2s, color .2s',
              }}
            >
              了解服務項目
            </a>
          </div>
          <div style={{ marginTop: 38, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'rgba(94,114,89,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              ☎
            </span>
            <div style={{ lineHeight: 1.35 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: '#8A8175' }}>24 小時免費諮詢專線</div>
              <a href="tel:0921223518" style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: '#2A2622', textDecoration: 'none', letterSpacing: 1 }}>
                0921-223-518
              </a>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 360px', minWidth: 300 }}>
          <ImageSlot
            id="kh-hero"
            radius={18}
            placeholder="拖入主視覺照片（建議：晨光、蓮花、寧靜自然場景）"
            style={{ width: '100%', aspectRatio: '4 / 5', boxShadow: '0 30px 70px -30px rgba(50,46,41,0.4)' }}
          />
        </div>
      </section>

      {/* ============ VALUE STRIP ============ */}
      <section style={{ background: '#EFE8DC' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: 'clamp(34px, 4vw, 52px) clamp(20px, 4vw, 48px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'clamp(20px, 3vw, 44px)',
          }}
        >
          {values.map((v) => (
            <div key={v.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 'clamp(30px, 3.4vw, 40px)', fontWeight: 700, color: '#5E7259', lineHeight: 1 }}>
                {v.stat}
              </span>
              <span style={{ fontWeight: 600, fontSize: 16, color: '#3A352F', letterSpacing: 1 }}>{v.title}</span>
              <span style={{ fontSize: 14, color: '#7A7268' }}>{v.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" style={{ scrollMarginTop: 90, maxWidth: 1240, margin: '0 auto', padding: SECTION_PAD }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto clamp(40px, 5vw, 62px)' }}>
          <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#B89968', fontWeight: 500, marginBottom: 16 }}>
            OUR SERVICES
          </span>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 18px', color: '#2A2622' }}>
            全程禮儀服務
          </h2>
          <p style={{ fontSize: 17, color: '#6A6258', margin: 0 }}>
            從接體安置到後續關懷，每一個環節都由專人全程協助。讓家屬能安心陪伴、好好告別，其餘繁瑣事務交由我們妥善安排。
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(18px, 2.4vw, 28px)' }}>
          {services.map((s) => (
            <div
              key={s.title}
              className="kh-service-card"
              style={{
                background: '#FDFBF7',
                border: '1px solid rgba(50,46,41,0.07)',
                borderRadius: 16,
                padding: '32px 28px',
                transition: 'transform .25s, box-shadow .25s, border-color .25s',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: 'rgba(94,114,89,0.12)',
                  fontSize: 26,
                  marginBottom: 20,
                }}
              >
                {s.icon}
              </span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, letterSpacing: 1, margin: '0 0 12px', color: '#2E2A26' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 15, color: '#7A7268', margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PRE-NEED CONTRACT ============ */}
      <section id="contract" style={{ scrollMarginTop: 90, background: '#5E7259', color: '#F6F1E9' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: SECTION_PAD,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'clamp(36px, 5vw, 70px)',
          }}
        >
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: 'rgba(246,241,233,0.7)', fontWeight: 500, marginBottom: 16 }}>
              PRE-NEED CONTRACT
            </span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 20px' }}>
              生前契約
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(246,241,233,0.86)', margin: '0 0 30px', maxWidth: '32em' }}>
              為自己與家人預先規劃，是一份體貼的愛。提早安排身後事，不僅減輕家人在悲傷時的負擔，更能確保一切依照自己的心願圓滿完成。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {contractPoints.map((p) => (
                <div key={p.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(246,241,233,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: 1, marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(246,241,233,0.72)' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="#contact"
              className="kh-lift"
              style={{
                display: 'inline-flex',
                marginTop: 34,
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                background: '#F6F1E9',
                color: '#4C5E48',
                padding: '14px 30px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: 1,
                transition: 'transform .2s',
              }}
            >
              預約了解生前契約
            </a>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <ImageSlot
              id="kh-contract"
              radius={18}
              placeholder="拖入照片（建議：家人相伴 / 安心託付）"
              style={{ width: '100%', aspectRatio: '1 / 1', boxShadow: '0 30px 60px -28px rgba(0,0,0,0.45)' }}
            />
          </div>
        </div>
      </section>

      {/* ============ MEMORIAL HALL ============ */}
      <section id="hall" style={{ scrollMarginTop: 90, maxWidth: 1240, margin: '0 auto', padding: SECTION_PAD }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(36px, 5vw, 64px)' }}>
          <div style={{ flex: '1 1 340px', minWidth: 300, order: 2 }}>
            <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#B89968', fontWeight: 500, marginBottom: 16 }}>
              MEMORIAL HALL
            </span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 20px', color: '#2A2622' }}>
              追思會館
            </h2>
            <p style={{ fontSize: 17, color: '#6A6258', margin: '0 0 28px', maxWidth: '32em' }}>
              莊嚴雅緻的告別空間，柔和的光線與素雅的布置，讓家屬與親友能在寧靜的氛圍中，從容地獻上最後的思念與祝福。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {hallFeatures.map((h) => (
                <div key={h.title} style={{ background: '#FDFBF7', border: '1px solid rgba(50,46,41,0.07)', borderRadius: 12, padding: '18px 18px' }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#3A352F', letterSpacing: 1, marginBottom: 4 }}>{h.title}</div>
                  <div style={{ fontSize: 13.5, color: '#7A7268' }}>{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 340px', minWidth: 300, order: 1 }}>
            <ImageSlot
              id="kh-hall"
              radius={18}
              placeholder="拖入照片（建議：莊嚴會場 / 柔光花藝布置）"
              style={{ width: '100%', aspectRatio: '5 / 4', boxShadow: '0 26px 56px -30px rgba(50,46,41,0.4)' }}
            />
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section id="process" style={{ scrollMarginTop: 90, background: '#EFE8DC' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: SECTION_PAD }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto clamp(44px, 5vw, 64px)' }}>
            <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#B89968', fontWeight: 500, marginBottom: 16 }}>
              THE PROCESS
            </span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 18px', color: '#2A2622' }}>
              治喪流程
            </h2>
            <p style={{ fontSize: 17, color: '#6A6258', margin: 0 }}>完整透明的服務流程，每一步都有專人陪同說明，讓您清楚安心。</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 27, top: 10, bottom: 10, width: 2, background: 'rgba(94,114,89,0.25)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((st) => (
                <div
                  key={st.num}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    gap: 24,
                    alignItems: 'flex-start',
                    background: '#FBF7EF',
                    border: '1px solid rgba(50,46,41,0.06)',
                    borderRadius: 14,
                    padding: '22px 26px',
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: '#5E7259',
                      color: '#F6F1E9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: SERIF,
                      fontSize: 22,
                      fontWeight: 600,
                    }}
                  >
                    {st.num}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, letterSpacing: 1, margin: '4px 0 6px', color: '#2E2A26' }}>
                      {st.title}
                    </h3>
                    <p style={{ fontSize: 15, color: '#7A7268', margin: 0 }}>{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" style={{ scrollMarginTop: 90, maxWidth: 1240, margin: '0 auto', padding: SECTION_PAD }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px, 5vw, 70px)', alignItems: 'center' }}>
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#B89968', fontWeight: 500, marginBottom: 16 }}>
              ABOUT US
            </span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 22px', color: '#2A2622' }}>
              關於廣興禮儀
            </h2>
            <p style={{ fontSize: 17, color: '#6A6258', margin: '0 0 18px' }}>
              三十年來，廣興禮儀深耕於高雄美濃，陪伴無數家庭走過人生中最艱難的時刻。我們深信，殯葬服務不只是流程的安排，更是一份對生命的敬重與對家屬的溫柔守護。
            </p>
            <p style={{ fontSize: 17, color: '#6A6258', margin: '0 0 30px' }}>
              以同理心傾聽每一個家庭的需求，用專業與真誠，協助每一位摯愛的親人，有尊嚴地走完人生最後一程。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18 }}>
              {aboutValues.map((a) => (
                <div key={a.title} style={{ borderLeft: '3px solid #5E7259', paddingLeft: 16 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: '#2E2A26', letterSpacing: 2, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 14, color: '#7A7268' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <ImageSlot
              id="kh-about"
              radius={18}
              placeholder="拖入照片（建議：團隊合影 / 在地美濃風景）"
              style={{ width: '100%', aspectRatio: '4 / 5', boxShadow: '0 30px 64px -30px rgba(50,46,41,0.42)' }}
            />
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" style={{ scrollMarginTop: 90, background: '#2E2A26', color: '#F1ECE3' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: SECTION_PAD,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(40px, 5vw, 72px)',
          }}
        >
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <span style={{ display: 'inline-block', fontSize: 13, letterSpacing: 4, color: '#B89968', fontWeight: 500, marginBottom: 16 }}>
              CONTACT US
            </span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: 2, margin: '0 0 20px' }}>
              聯絡我們
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(241,236,227,0.74)', margin: '0 0 38px', maxWidth: '30em' }}>
              無論是緊急需求或預先諮詢，我們 24 小時都在。請放心與我們聯繫，由專人為您細心說明。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <a href="tel:0921223518" style={{ display: 'flex', alignItems: 'center', gap: 18, textDecoration: 'none', color: 'inherit' }}>
                <span style={contactIcon}>☎</span>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(241,236,227,0.6)' }}>24 小時免費專線</div>
                  <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, letterSpacing: 1 }}>0921-223-518</div>
                </div>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={contactIcon}>⌂</span>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(241,236,227,0.6)' }}>服務地址</div>
                  <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: 0.5 }}>高雄市美濃區合和里東門街72號</div>
                </div>
              </div>
              <a href="mailto:4051Y016@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 18, textDecoration: 'none', color: 'inherit' }}>
                <span style={contactIcon}>✉</span>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(241,236,227,0.6)' }}>電子信箱</div>
                  <div style={{ fontSize: 17, fontWeight: 500 }}>4051Y016@gmail.com</div>
                </div>
              </a>
            </div>
          </div>

          {/* form */}
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div
              style={{
                background: '#F6F1E9',
                color: '#322E29',
                borderRadius: 20,
                padding: 'clamp(28px, 3.5vw, 40px)',
                boxShadow: '0 30px 70px -30px rgba(0,0,0,0.5)',
              }}
            >
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', animation: 'kh-fadeUp .5s ease both' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(94,114,89,0.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 34,
                      margin: '0 auto 22px',
                      color: '#5E7259',
                    }}
                  >
                    ✓
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, margin: '0 0 12px', color: '#2E2A26' }}>已收到您的諮詢</h3>
                  <p style={{ fontSize: 15, color: '#6A6258', margin: '0 0 26px' }}>
                    感謝您的信任，我們將盡快與您聯繫。
                    <br />
                    若有急需，歡迎直接撥打 24 小時專線。
                  </p>
                  <button
                    onClick={resetForm}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(50,46,41,0.2)',
                      color: '#4A4540',
                      padding: '12px 26px',
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    再填一筆
                  </button>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, margin: '0 0 6px', color: '#2E2A26' }}>免費諮詢預約</h3>
                  <p style={{ fontSize: 14, color: '#8A8175', margin: '0 0 24px' }}>填寫後我們將主動與您聯繫，所有資訊皆嚴格保密。</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <label style={fieldLabel}>
                      <span style={labelText}>
                        稱呼 <span style={{ color: '#B05A4A' }}>*</span>
                      </span>
                      <input
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="您的姓名"
                        style={{ ...inputStyle, border: `1.5px solid ${nameBorder}` }}
                      />
                    </label>
                    <label style={fieldLabel}>
                      <span style={labelText}>
                        聯絡電話 <span style={{ color: '#B05A4A' }}>*</span>
                      </span>
                      <input
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        placeholder="方便聯繫的電話"
                        style={{ ...inputStyle, border: `1.5px solid ${phoneBorder}` }}
                      />
                    </label>
                    <label style={fieldLabel}>
                      <span style={labelText}>諮詢項目</span>
                      <select
                        value={form.topic}
                        onChange={(e) => setField('topic', e.target.value)}
                        style={{ ...inputStyle, border: '1.5px solid rgba(50,46,41,0.16)' }}
                      >
                        {topics.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={fieldLabel}>
                      <span style={labelText}>想說的話</span>
                      <textarea
                        value={form.message}
                        onChange={(e) => setField('message', e.target.value)}
                        rows={3}
                        placeholder="可簡述您的需求或狀況（非必填）"
                        style={{ ...inputStyle, border: '1.5px solid rgba(50,46,41,0.16)', resize: 'vertical' }}
                      />
                    </label>
                    {error && (
                      <div style={{ fontSize: 13.5, color: '#B05A4A', background: 'rgba(176,90,74,0.08)', padding: '10px 14px', borderRadius: 8 }}>
                        {error}
                      </div>
                    )}
                    <button
                      onClick={submitForm}
                      className="kh-cta"
                      style={{
                        marginTop: 4,
                        background: '#5E7259',
                        color: '#F6F1E9',
                        border: 'none',
                        padding: 15,
                        borderRadius: 999,
                        fontFamily: 'inherit',
                        fontSize: 16,
                        fontWeight: 500,
                        letterSpacing: 1,
                        cursor: 'pointer',
                        boxShadow: '0 10px 24px rgba(94,114,89,0.3)',
                        transition: 'background .2s, transform .2s',
                      }}
                    >
                      送出諮詢
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: '#25211D', color: 'rgba(241,236,227,0.6)' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: 'clamp(40px, 5vw, 56px) clamp(20px, 4vw, 48px)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#5E7259',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: '#F6F1E9' }}>廣</span>
            </span>
            <div style={{ lineHeight: 1.4 }}>
              <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, letterSpacing: 2, color: '#F1ECE3' }}>廣興禮儀公司</div>
              <div style={{ fontSize: 13 }}>用愛與尊嚴，圓滿人生的最後一程</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.9, textAlign: 'right' }}>
            <div>24 小時專線　0921-223-518</div>
            <div>高雄市美濃區合和里東門街72號</div>
            <div>4051Y016@gmail.com</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(241,236,227,0.08)', textAlign: 'center', padding: 18, fontSize: 12.5, letterSpacing: 1 }}>
          © 2026 廣興禮儀公司 KUANG HING FUNERAL · 版權所有
        </div>
      </footer>
    </div>
  )
}

const contactIcon: React.CSSProperties = {
  flexShrink: 0,
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: 'rgba(94,114,89,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
}

const fieldLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 }
const labelText: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#4A4540', letterSpacing: 1 }
const inputStyle: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 15,
  padding: '13px 16px',
  borderRadius: 10,
  background: '#FFFEFB',
  color: '#322E29',
  outline: 'none',
}
