'use client'
import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Trash2, Tag, X } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId, formatDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { Article } from '@/types'

export default function ArticleWidget() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filter, setFilter] = useState<string>('全部')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ url: '', title: '', description: '', tagInput: '', tags: [] as string[] })

  useEffect(() => { setArticles(getItem<Article[]>('articles', [])) }, [])

  const save = (next: Article[]) => { setArticles(next); setItem('articles', next) }

  const addTag = () => {
    const t = form.tagInput.trim()
    if (!t || form.tags.includes(t)) return
    setForm({ ...form, tags: [...form.tags, t], tagInput: '' })
  }

  const add = () => {
    if (!form.url.trim()) return
    let title = form.title.trim()
    if (!title) {
      try { title = new URL(form.url).hostname } catch { title = form.url }
    }
    save([{ id: generateId(), url: form.url.trim(), title, description: form.description.trim(), tags: form.tags, saved: true, createdAt: new Date().toISOString() }, ...articles])
    setForm({ url: '', title: '', description: '', tagInput: '', tags: [] })
    setOpen(false)
  }

  const remove = (id: string) => save(articles.filter((a) => a.id !== id))

  const allTags = ['全部', ...Array.from(new Set(articles.flatMap((a) => a.tags)))]
  const filtered = filter === '全部' ? articles : articles.filter((a) => a.tags.includes(filter))

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Tag filter */}
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-[#334155] overflow-x-auto scrollbar-thin">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setFilter(tag)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-full transition-all"
              style={{ background: filter === tag ? '#3b82f6' : '#0f172a', color: filter === tag ? '#fff' : '#94a3b8', border: `1px solid ${filter === tag ? '#3b82f6' : '#334155'}` }}>
              {tag}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[#334155]">
          {filtered.length === 0 ? (
            <p className="text-center text-[#475569] text-sm py-6">沒有文章，快去儲存！</p>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="group px-4 py-3 hover:bg-[#243447] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-sm font-medium text-[#93c5fd] hover:text-[#60a5fa] truncate flex items-center gap-1">
                    {a.title}
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                  <button onClick={() => remove(a.id)} className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
                {a.description && <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2">{a.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-[#475569]">{formatDate(a.createdAt)}</span>
                  {a.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-[#1e3a5f] text-[#93c5fd] px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#334155]">
          <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#243447] rounded-lg py-2 transition-colors">
            <Plus size={14} /> 儲存文章
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="儲存文章">
        <div className="space-y-3">
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="網址 URL *" className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="標題（留空自動抓取）" className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="摘要（選填）" rows={2} className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6] resize-none" />
          <div>
            <div className="flex gap-2">
              <input value={form.tagInput} onChange={(e) => setForm({ ...form, tagInput: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="新增標籤" className="flex-1 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
              <button onClick={addTag} className="bg-[#1e3a5f] text-[#93c5fd] rounded-lg px-3 py-2 text-sm"><Tag size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-[#1e3a5f] text-[#93c5fd] px-2 py-1 rounded">
                  {t}
                  <button onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
          <button onClick={add} disabled={!form.url.trim()} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">儲存</button>
        </div>
      </Modal>
    </>
  )
}
