'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Plus } from 'lucide-react'
import { getItem } from '@/lib/storage'
import type { MedicalPaper, JournalSource } from '@/types'

const SOURCE_COLORS: Record<JournalSource, { bg: string; text: string; border: string }> = {
  JAMA:             { bg: '#3b1111', text: '#fca5a5', border: '#7f1d1d' },
  NEJM:             { bg: '#172554', text: '#93c5fd', border: '#1e3a8a' },
  Lancet:           { bg: '#2e1065', text: '#c4b5fd', border: '#4c1d95' },
  BMJ:              { bg: '#431407', text: '#fdba74', border: '#7c2d12' },
  'Nature Medicine':{ bg: '#052e16', text: '#86efac', border: '#14532d' },
  Other:            { bg: '#0f172a', text: '#94a3b8', border: '#334155' },
}

export default function MedicalJournalWidget() {
  const [papers, setPapers] = useState<MedicalPaper[]>([])

  useEffect(() => {
    setPapers(getItem<MedicalPaper[]>('medical-papers', []))
  }, [])

  const recent = papers.slice(0, 4)

  const sourceCounts: Partial<Record<JournalSource, number>> = {}
  papers.forEach(p => { sourceCounts[p.journalSource] = (sourceCounts[p.journalSource] || 0) + 1 })
  const topSources = (Object.entries(sourceCounts) as [JournalSource, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-[#3b82f6]">{papers.length}</span>
          <span className="text-xs text-[#475569]">篇論文</span>
        </div>
        {topSources.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topSources.map(([source, count]) => {
              const c = SOURCE_COLORS[source]
              return (
                <span key={source} className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {source} {count}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-[#475569]">尚無論文</p>
        )}
      </div>

      {/* Recent papers */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-[#334155]">
        {recent.length === 0 ? (
          <p className="text-center text-[#475569] text-xs py-6">快去收藏第一篇論文！</p>
        ) : (
          recent.map(p => {
            const c = SOURCE_COLORS[p.journalSource]
            return (
              <div key={p.id} className="px-4 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                    style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                    {p.journalSource}
                  </span>
                  <span className="text-xs text-[#475569]">{p.year}</span>
                </div>
                <p className="text-xs text-[#cbd5e1] line-clamp-2 leading-snug">{p.title}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#334155]">
        <Link href="/journals"
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
          <ExternalLink size={11} /> 查看全部
        </Link>
        <Link href="/journals"
          className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
          <Plus size={11} /> 新增論文
        </Link>
      </div>
    </div>
  )
}
