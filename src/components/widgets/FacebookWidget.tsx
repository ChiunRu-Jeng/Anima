'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { RefreshCw, Send, Eye, ThumbsUp, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface FBPage {
  id: string
  name: string
  fanCount: number
  followersCount: number
  picture: string | null
  reach7d: number | null
  impressions7d: number | null
  engagements7d: number | null
}

interface Campaign {
  id: string
  name: string
  status: string
  spend: string
  impressions: string
  clicks: string
  ctr: string
  cpc: string
  reach: string
}

interface AdAccount {
  id: string
  name: string
  currency: string
  campaigns: Campaign[]
}

interface PublishResult {
  pageId: string
  success: boolean
  error: string | null
}

type Tab = '社群' | '廣告' | '發文'

const fmt = (n: number | string | null) => {
  if (n === null || n === undefined) return '—'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

export default function FacebookWidget() {
  const [tab, setTab] = useState<Tab>('社群')
  const [pages, setPages] = useState<FBPage[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)
  const [publishResults, setPublishResults] = useState<PublishResult[]>([])

  const fetchPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/facebook/pages')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '無法取得粉專')
      setPages(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/facebook/ads')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '無法取得廣告資料')
      setAdAccounts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === '社群') fetchPages()
    else if (tab === '廣告') fetchAds()
    else if (tab === '發文' && pages.length === 0) fetchPages()
  }, [tab, fetchPages, fetchAds, pages.length])

  const togglePage = (id: string) => {
    setSelectedPages(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const publish = async () => {
    if (!message.trim() || selectedPages.size === 0) return
    setPublishing(true)
    setPublishResults([])
    try {
      const res = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageIds: Array.from(selectedPages), message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '發布失敗')
      const results = data as PublishResult[]
      setPublishResults(results)
      if (results.every(r => r.success)) {
        setMessage('')
        setSelectedPages(new Set())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPublishing(false)
    }
  }

  const statusColor = (s: string) =>
    s === 'ACTIVE' ? 'text-[#22c55e]' : s === 'PAUSED' ? 'text-[#f59e0b]' : 'text-[#475569]'

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 border-b border-[#334155]">
        <div className="flex">
          {(['社群', '廣告', '發文'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-[#1877f2] text-[#1877f2]' : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab !== '發文' && (
          <button
            onClick={tab === '社群' ? fetchPages : fetchAds}
            disabled={loading}
            className="text-[#94a3b8] hover:text-[#f1f5f9] disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 text-[#f87171] text-xs bg-[#1c0f0f] border-b border-[#334155]">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* 社群 Tab */}
        {tab === '社群' && (
          <div className="p-3 space-y-2">
            {loading && pages.length === 0 && (
              <div className="flex justify-center py-10">
                <RefreshCw size={16} className="animate-spin text-[#475569]" />
              </div>
            )}
            {!loading && pages.length === 0 && !error && (
              <p className="text-center text-[#475569] text-sm py-10">
                未找到粉專<br />
                <span className="text-xs">請確認已設定 FB_USER_TOKEN 和 FB_BUSINESS_ID</span>
              </p>
            )}
            {pages.map(page => (
              <div key={page.id} className="bg-[#0f172a] rounded-lg p-3">
                <div className="flex items-center gap-2.5 mb-2.5">
                  {page.picture ? (
                    <Image src={page.picture} alt={page.name} width={32} height={32} className="rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {page.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-[#e2e8f0]">{page.name}</div>
                    <div className="text-xs text-[#475569]">
                      {fmt(page.fanCount)} 粉絲 · {fmt(page.followersCount)} 追蹤
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <Eye size={10} className="text-[#3b82f6]" />, val: page.reach7d, label: '7d 觸及' },
                    { icon: <TrendingUp size={10} className="text-[#8b5cf6]" />, val: page.impressions7d, label: '7d 曝光' },
                    { icon: <ThumbsUp size={10} className="text-[#22c55e]" />, val: page.engagements7d, label: '7d 互動' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} className="bg-[#1e293b] rounded p-2 text-center">
                      <div className="flex justify-center mb-1">{icon}</div>
                      <div className="text-xs font-semibold text-[#e2e8f0] tabular-nums">{fmt(val)}</div>
                      <div className="text-[10px] text-[#475569]">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 廣告 Tab */}
        {tab === '廣告' && (
          <div className="p-3 space-y-3">
            {loading && adAccounts.length === 0 && (
              <div className="flex justify-center py-10">
                <RefreshCw size={16} className="animate-spin text-[#475569]" />
              </div>
            )}
            {!loading && adAccounts.length === 0 && !error && (
              <p className="text-center text-[#475569] text-sm py-10">未找到廣告帳號</p>
            )}
            {adAccounts.map(acct => (
              <div key={acct.id}>
                <div className="text-xs font-medium text-[#94a3b8] mb-2 px-0.5">
                  {acct.name}
                  <span className="text-[#475569] ml-1">({acct.currency})</span>
                </div>
                {acct.campaigns.length === 0 && (
                  <p className="text-xs text-[#475569] mb-2">近 7 天無廣告活動資料</p>
                )}
                {acct.campaigns.map(c => (
                  <div key={c.id} className="bg-[#0f172a] rounded-lg p-3 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-[#e2e8f0] leading-tight flex-1 mr-2">{c.name}</div>
                      <span className={`text-xs font-medium shrink-0 ${statusColor(c.status)}`}>{c.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '花費', value: `${acct.currency === 'TWD' ? 'NT$' : '$'}${fmt(c.spend)}` },
                        { label: '曝光', value: fmt(c.impressions) },
                        { label: '觸及', value: fmt(c.reach) },
                        { label: '點擊', value: fmt(c.clicks) },
                        { label: 'CTR', value: `${parseFloat(c.ctr || '0').toFixed(2)}%` },
                        { label: 'CPC', value: fmt(c.cpc) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#1e293b] rounded p-1.5 text-center">
                          <div className="text-xs font-semibold text-[#e2e8f0] tabular-nums">{value}</div>
                          <div className="text-[10px] text-[#475569]">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 發文 Tab */}
        {tab === '發文' && (
          <div className="p-3 space-y-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="輸入貼文內容…"
              rows={5}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#475569] resize-none focus:outline-none focus:border-[#1877f2] transition-colors"
            />

            <div>
              <div className="text-xs text-[#94a3b8] mb-2">選擇發文粉專：</div>
              {pages.length === 0 ? (
                <p className="text-xs text-[#475569] flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> 載入粉專中…
                </p>
              ) : (
                <div className="space-y-2">
                  {pages.map(page => (
                    <label key={page.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={selectedPages.has(page.id)}
                        onChange={() => togglePage(page.id)}
                        className="w-3.5 h-3.5 accent-[#1877f2] shrink-0"
                      />
                      {page.picture ? (
                        <Image src={page.picture} alt={page.name} width={20} height={20} className="rounded-full shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#1877f2] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {page.name[0]}
                        </div>
                      )}
                      <span className="text-sm text-[#e2e8f0] group-hover:text-white transition-colors">{page.name}</span>
                      <span className="text-xs text-[#475569] ml-auto">{fmt(page.fanCount)} 粉絲</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {publishResults.length > 0 && (
              <div className="space-y-1">
                {publishResults.map(r => {
                  const page = pages.find(p => p.id === r.pageId)
                  return (
                    <div
                      key={r.pageId}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded ${
                        r.success ? 'bg-[#14532d] text-[#4ade80]' : 'bg-[#7f1d1d] text-[#fca5a5]'
                      }`}
                    >
                      {r.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      <span className="font-medium">{page?.name || r.pageId}</span>
                      <span>{r.success ? '發布成功' : `— ${r.error}`}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={publish}
              disabled={publishing || !message.trim() || selectedPages.size === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1877f2] hover:bg-[#1558b0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {publishing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              {publishing
                ? '發布中…'
                : selectedPages.size > 0
                ? `同步發布到 ${selectedPages.size} 個粉專`
                : '請選擇粉專'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
