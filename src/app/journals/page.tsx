'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Search, BookOpen, Trash2, ExternalLink, Tag, X,
  Settings, Send, Loader2, ChevronDown, FileText, AlertCircle,
} from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { MedicalPaper, JournalSource } from '@/types'

const SOURCES: JournalSource[] = ['JAMA', 'NEJM', 'Lancet', 'BMJ', 'Nature Medicine', 'Other']

const SOURCE_COLORS: Record<JournalSource, { bg: string; text: string; border: string }> = {
  JAMA:             { bg: '#3b1111', text: '#fca5a5', border: '#7f1d1d' },
  NEJM:             { bg: '#172554', text: '#93c5fd', border: '#1e3a8a' },
  Lancet:           { bg: '#2e1065', text: '#c4b5fd', border: '#4c1d95' },
  BMJ:              { bg: '#431407', text: '#fdba74', border: '#7c2d12' },
  'Nature Medicine':{ bg: '#052e16', text: '#86efac', border: '#14532d' },
  Other:            { bg: '#0f172a', text: '#94a3b8', border: '#334155' },
}

const defaultForm = {
  pmid: '',
  title: '',
  authors: '',
  journal: '',
  journalSource: 'Other' as JournalSource,
  year: new Date().getFullYear(),
  volume: '', issue: '', pages: '',
  doi: '', url: '',
  abstract: '',
  tagInput: '', tags: [] as string[],
  notes: '',
}

function SourceBadge({ source }: { source: JournalSource }) {
  const c = SOURCE_COLORS[source]
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium shrink-0"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {source}
    </span>
  )
}

export default function JournalsPage() {
  const [papers, setPapers]       = useState<MedicalPaper[]>([])
  const [search, setSearch]       = useState('')
  const [filterSource, setFilterSource] = useState<JournalSource | '全部'>('全部')
  const [filterYear, setFilterYear]     = useState('全部')
  const [filterTag, setFilterTag]       = useState('全部')
  const [sortBy, setSortBy]             = useState<'newest' | 'oldest' | 'year-desc' | 'year-asc'>('newest')

  const [selected, setSelected]   = useState<MedicalPaper | null>(null)
  const [addOpen, setAddOpen]     = useState(false)
  const [form, setForm]           = useState(defaultForm)
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey]     = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState('')

  const [qaQuestion, setQaQuestion] = useState('')
  const [qaAnswer, setQaAnswer]     = useState('')
  const [qaLoading, setQaLoading]   = useState(false)
  const [qaError, setQaError]       = useState('')

  useEffect(() => {
    setPapers(getItem<MedicalPaper[]>('medical-papers', []))
    const key = getItem<string>('anthropic-api-key', '')
    setApiKey(key)
    setApiKeyDraft(key)
  }, [])

  const save = (next: MedicalPaper[]) => { setPapers(next); setItem('medical-papers', next) }

  // ── Derived data ──────────────────────────────────────────────────────────
  const allYears = useMemo(() =>
    [...new Set(papers.map(p => p.year))].sort((a, b) => b - a), [papers])

  const allTags = useMemo(() =>
    [...new Set(papers.flatMap(p => p.tags))].sort(), [papers])

  const filtered = useMemo(() => {
    let r = papers
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.journal.toLowerCase().includes(q) ||
        (p.abstract || '').toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filterSource !== '全部') r = r.filter(p => p.journalSource === filterSource)
    if (filterYear  !== '全部') r = r.filter(p => p.year === parseInt(filterYear))
    if (filterTag   !== '全部') r = r.filter(p => p.tags.includes(filterTag))
    return [...r].sort((a, b) => {
      if (sortBy === 'newest')    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest')    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'year-desc') return b.year - a.year
      if (sortBy === 'year-asc')  return a.year - b.year
      return 0
    })
  }, [papers, search, filterSource, filterYear, filterTag, sortBy])

  const sourceCounts = useMemo(() => {
    const m: Partial<Record<JournalSource, number>> = {}
    papers.forEach(p => { m[p.journalSource] = (m[p.journalSource] || 0) + 1 })
    return m
  }, [papers])

  // ── PubMed import ─────────────────────────────────────────────────────────
  const importPubMed = async () => {
    const pmid = form.pmid.trim()
    if (!pmid) return
    setImporting(true); setImportErr('')
    try {
      const res = await fetch(`/api/pubmed?pmid=${pmid}`)
      const data = await res.json()
      if (!res.ok) { setImportErr(data.error || 'Import failed'); return }
      setForm(prev => ({
        ...prev,
        title:         data.title || '',
        authors:       (data.authors || []).join(', '),
        journal:       data.journal || '',
        journalSource: data.journalSource || 'Other',
        year:          data.year || prev.year,
        volume:        data.volume || '',
        issue:         data.issue || '',
        pages:         data.pages || '',
        doi:           data.doi || '',
        url:           data.url || '',
        abstract:      data.abstract || '',
      }))
    } catch {
      setImportErr('Network error')
    } finally {
      setImporting(false)
    }
  }

  // ── Add paper ─────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = form.tagInput.trim()
    if (!t || form.tags.includes(t)) return
    setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }))
  }

  const addPaper = () => {
    if (!form.title.trim()) return
    const paper: MedicalPaper = {
      id:            generateId(),
      title:         form.title.trim(),
      authors:       form.authors.split(',').map(a => a.trim()).filter(Boolean),
      journal:       form.journal.trim(),
      journalSource: form.journalSource,
      year:          form.year,
      volume:        form.volume.trim() || undefined,
      issue:         form.issue.trim() || undefined,
      pages:         form.pages.trim() || undefined,
      doi:           form.doi.trim() || undefined,
      pmid:          form.pmid.trim() || undefined,
      url:           form.url.trim() || undefined,
      abstract:      form.abstract.trim() || undefined,
      tags:          form.tags,
      notes:         form.notes.trim() || undefined,
      createdAt:     new Date().toISOString(),
    }
    save([paper, ...papers])
    setForm(defaultForm); setAddOpen(false)
  }

  const removePaper = (id: string) => {
    save(papers.filter(p => p.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  // ── AI Q&A ────────────────────────────────────────────────────────────────
  const askAI = async () => {
    if (!qaQuestion.trim()) return
    if (!apiKey) { setQaError('請先在設定中輸入 Anthropic API Key'); return }
    setQaLoading(true); setQaError(''); setQaAnswer('')
    try {
      const res = await fetch('/api/ask-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, question: qaQuestion, papers }),
      })
      const data = await res.json()
      if (!res.ok) { setQaError(data.error || 'AI error'); return }
      setQaAnswer(data.answer)
    } catch {
      setQaError('Network error')
    } finally {
      setQaLoading(false)
    }
  }

  const saveApiKey = () => {
    setApiKey(apiKeyDraft)
    setItem('anthropic-api-key', apiKeyDraft)
    setSettingsOpen(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]'
  const selectCls = 'bg-[#0f172a] border border-[#334155] text-[#94a3b8] text-sm rounded-lg px-2 py-1.5 outline-none focus:border-[#3b82f6] appearance-none pr-6'

  return (
    <main className="min-h-screen p-4 lg:p-6" style={{ background: '#0f172a' }}>
      <div className="max-w-[1200px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
              <ArrowLeft size={15} /> Dashboard
            </Link>
            <span className="text-[#334155]">/</span>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#3b82f6]" />
              <h1 className="text-lg font-semibold text-[#f1f5f9]">醫學期刊資料庫</h1>
            </div>
            <span className="text-xs text-[#94a3b8] bg-[#1e293b] border border-[#334155] px-2 py-0.5 rounded-full">
              {papers.length} 篇論文
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSettingsOpen(true)}
              className="p-2 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e293b] rounded-lg transition-colors border border-[#334155]">
              <Settings size={15} />
            </button>
            <button onClick={() => { setForm(defaultForm); setImportErr(''); setAddOpen(true) }}
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              <Plus size={14} /> 新增論文
            </button>
          </div>
        </div>

        {/* Source stats */}
        {papers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {SOURCES.map(s => sourceCounts[s] ? (
              <button key={s} onClick={() => setFilterSource(filterSource === s ? '全部' : s)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: filterSource === s ? SOURCE_COLORS[s].bg : '#1e293b',
                  color: filterSource === s ? SOURCE_COLORS[s].text : '#94a3b8',
                  border: `1px solid ${filterSource === s ? SOURCE_COLORS[s].border : '#334155'}`,
                }}>
                {s} <span className="opacity-70">{sourceCounts[s]}</span>
              </button>
            ) : null)}
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜尋標題、作者、摘要…"
              className="w-full bg-[#1e293b] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#3b82f6]" />
          </div>
          <div className="relative">
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className={selectCls}>
              <option value="全部">所有年份</option>
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className={selectCls}>
              <option value="全部">所有標籤</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className={selectCls}>
              <option value="newest">最新加入</option>
              <option value="oldest">最早加入</option>
              <option value="year-desc">年份（新→舊）</option>
              <option value="year-asc">年份（舊→新）</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
          </div>
        </div>

        {/* Paper list */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#475569]">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{papers.length === 0 ? '尚無論文，點擊「新增論文」開始建立資料庫' : '沒有符合條件的論文'}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#334155]">
              {filtered.map(paper => (
                <div key={paper.id}
                  className="group px-4 py-3.5 hover:bg-[#243447] transition-colors cursor-pointer"
                  onClick={() => setSelected(paper)}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <SourceBadge source={paper.journalSource} />
                        <span className="text-xs text-[#475569] mt-0.5">{paper.year}</span>
                      </div>
                      <p className="text-sm font-medium text-[#f1f5f9] mt-1 line-clamp-2">{paper.title}</p>
                      {paper.authors.length > 0 && (
                        <p className="text-xs text-[#94a3b8] mt-0.5 truncate">
                          {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}
                        </p>
                      )}
                      {paper.abstract && (
                        <p className="text-xs text-[#64748b] mt-1 line-clamp-2">{paper.abstract}</p>
                      )}
                      {paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {paper.tags.map(t => (
                            <span key={t} className="text-xs bg-[#1e3a5f] text-[#93c5fd] px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); removePaper(paper.id) }}
                      className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all shrink-0 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Health Q&A */}
        <div className="rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#334155]">
            <Send size={14} className="text-[#3b82f6]" />
            <span className="text-sm font-medium text-[#cbd5e1]">AI 健康諮詢</span>
            <span className="text-xs text-[#475569]">— 由您的論文資料庫作為知識來源</span>
          </div>
          <div className="p-4 space-y-3">
            {!apiKey && (
              <div className="flex items-center gap-2 text-xs text-[#f97316] bg-[#431407]/40 border border-[#7c2d12]/40 rounded-lg px-3 py-2">
                <AlertCircle size={13} />
                尚未設定 Anthropic API Key，請點擊右上角設定圖示
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={qaQuestion}
                onChange={e => setQaQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && askAI()}
                placeholder="詢問健康、疾病、症狀相關問題…"
                className="flex-1 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]"
                disabled={qaLoading}
              />
              <button onClick={askAI} disabled={qaLoading || !qaQuestion.trim()}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
                {qaLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                送出
              </button>
            </div>
            {qaError && (
              <div className="flex items-center gap-2 text-xs text-[#fca5a5] bg-[#3b1111]/40 border border-[#7f1d1d]/40 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {qaError}
              </div>
            )}
            {qaAnswer && (
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                <p className="text-xs text-[#3b82f6] font-medium mb-2">AI 回答（基於您的論文資料庫）</p>
                <div className="text-sm text-[#cbd5e1] whitespace-pre-wrap leading-relaxed">{qaAnswer}</div>
              </div>
            )}
            {papers.length === 0 && (
              <p className="text-xs text-[#475569] text-center py-2">新增論文後即可使用 AI 諮詢功能</p>
            )}
          </div>
        </div>

      </div>

      {/* Paper detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="論文詳情">
        {selected && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-start gap-2 flex-wrap">
              <SourceBadge source={selected.journalSource} />
              <span className="text-xs text-[#475569] mt-0.5">{selected.year}</span>
              {selected.volume && <span className="text-xs text-[#475569] mt-0.5">Vol.{selected.volume}{selected.issue ? ` No.${selected.issue}` : ''}</span>}
              {selected.pages && <span className="text-xs text-[#475569] mt-0.5">pp.{selected.pages}</span>}
            </div>
            <h3 className="text-[#f1f5f9] font-semibold leading-snug">{selected.title}</h3>
            {selected.authors.length > 0 && (
              <div>
                <p className="text-xs text-[#475569] mb-1">作者</p>
                <p className="text-sm text-[#94a3b8]">{selected.authors.join(', ')}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#475569] mb-1">期刊</p>
              <p className="text-sm text-[#94a3b8]">{selected.journal}</p>
            </div>
            {selected.abstract && (
              <div>
                <p className="text-xs text-[#475569] mb-1">摘要</p>
                <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{selected.abstract}</p>
              </div>
            )}
            {selected.notes && (
              <div>
                <p className="text-xs text-[#475569] mb-1">筆記</p>
                <p className="text-sm text-[#f1f5f9] leading-relaxed">{selected.notes}</p>
              </div>
            )}
            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map(t => (
                  <span key={t} className="text-xs bg-[#1e3a5f] text-[#93c5fd] px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-1">
              {selected.doi && (
                <a href={`https://doi.org/${selected.doi}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#93c5fd] hover:text-[#60a5fa] border border-[#1e3a5f] bg-[#172554]/30 px-2.5 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={11} /> DOI
                </a>
              )}
              {selected.pmid && (
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${selected.pmid}/`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#93c5fd] hover:text-[#60a5fa] border border-[#1e3a5f] bg-[#172554]/30 px-2.5 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={11} /> PubMed
                </a>
              )}
              {selected.url && !selected.pmid && (
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#93c5fd] hover:text-[#60a5fa] border border-[#1e3a5f] bg-[#172554]/30 px-2.5 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={11} /> 原文連結
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add paper modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="新增論文">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {/* PubMed import */}
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 space-y-2">
            <p className="text-xs text-[#64748b] font-medium">從 PubMed 匯入（輸入 PMID 自動填入）</p>
            <div className="flex gap-2">
              <input value={form.pmid} onChange={e => setForm(f => ({ ...f, pmid: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && importPubMed()}
                placeholder="PubMed ID（例：33288910）"
                className="flex-1 bg-[#1e293b] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
              <button onClick={importPubMed} disabled={importing || !form.pmid.trim()}
                className="flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#1e40af] disabled:opacity-40 text-[#93c5fd] text-sm px-3 py-2 rounded-lg transition-colors shrink-0">
                {importing ? <Loader2 size={13} className="animate-spin" /> : null}
                匯入
              </button>
            </div>
            {importErr && <p className="text-xs text-[#fca5a5]">{importErr}</p>}
          </div>

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="論文標題 *" className={inputCls} />
          <input value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))}
            placeholder="作者（逗號分隔，例：Smith J, Lee Y）" className={inputCls} />

          <div className="grid grid-cols-2 gap-2">
            <input value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))}
              placeholder="期刊名稱" className={inputCls} />
            <div className="relative">
              <select value={form.journalSource} onChange={e => setForm(f => ({ ...f, journalSource: e.target.value as JournalSource }))}
                className={inputCls + ' cursor-pointer'}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || f.year }))}
              placeholder="年份" className={inputCls} />
            <input value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))}
              placeholder="卷" className={inputCls} />
            <input value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
              placeholder="期" className={inputCls} />
            <input value={form.pages} onChange={e => setForm(f => ({ ...f, pages: e.target.value }))}
              placeholder="頁碼" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))}
              placeholder="DOI（例：10.1001/jama…）" className={inputCls} />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="連結 URL" className={inputCls} />
          </div>

          <textarea value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
            placeholder="摘要（Abstract）" rows={4}
            className={inputCls + ' resize-none'} />

          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="個人筆記（選填）" rows={2}
            className={inputCls + ' resize-none'} />

          {/* Tags */}
          <div>
            <div className="flex gap-2">
              <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="新增標籤（Enter 確認）" className={inputCls + ' flex-1'} style={{ width: 'auto' }} />
              <button onClick={addTag} className="bg-[#1e3a5f] text-[#93c5fd] rounded-lg px-3 py-2 text-sm shrink-0">
                <Tag size={14} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-[#1e3a5f] text-[#93c5fd] px-2 py-1 rounded">
                    {t}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button onClick={addPaper} disabled={!form.title.trim()}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">
            儲存論文
          </button>
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="設定">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-1.5">Anthropic API Key</label>
            <input type="password" value={apiKeyDraft} onChange={e => setApiKeyDraft(e.target.value)}
              placeholder="sk-ant-…"
              className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
            <p className="text-xs text-[#475569] mt-1.5">
              用於 AI 健康諮詢功能。API Key 儲存於瀏覽器 localStorage，不會傳送到其他地方。
            </p>
          </div>
          <button onClick={saveApiKey}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg py-2 text-sm font-medium transition-colors">
            儲存
          </button>
        </div>
      </Modal>
    </main>
  )
}
