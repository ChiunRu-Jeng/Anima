'use client'
import { useState, useEffect, useCallback } from 'react'
import { GitBranch, RefreshCw, GitCommitHorizontal, Star } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'

interface GitHubData {
  login: string
  name?: string
  avatar: string
  publicRepos: number
  followers: number
  recentPushes: { repo: string; message: string; date: string }[]
  topRepos: { name: string; stars: number; language: string }[]
}

const LANG_COLOR: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572a5',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219', 'C#': '#178600',
}

export default function GitHubWidget() {
  const [username, setUsername] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [data, setData] = useState<GitHubData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = getItem<string>('github_username', '')
    if (saved) { setUsername(saved); setInputValue(saved) }
  }, [])

  const fetch_ = useCallback(async (user: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(user)}`)
      if (!res.ok) { setError('用戶不存在'); return }
      setData(await res.json())
    } catch {
      setError('載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (username) fetch_(username) }, [username, fetch_])

  const setUser = () => {
    const u = inputValue.trim()
    if (!u) return
    setUsername(u)
    setItem('github_username', u)
  }

  if (!username || (!data && !loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
        <GitBranch size={28} className="text-[#94a3b8]" />
        <p className="text-sm text-[#94a3b8] text-center">輸入 GitHub 用戶名</p>
        <div className="flex gap-2 w-full">
          <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setUser()} placeholder="GitHub username"
            className="flex-1 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <button onClick={setUser} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg px-3 py-2 text-sm transition-colors">設定</button>
        </div>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[#94a3b8] text-sm">載入中...</div>
  }

  if (!data) return null

  return (
    <div className="flex flex-col h-full">
      {/* Profile */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <img src={data.avatar} alt={data.login} className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#f1f5f9] truncate">{data.name || data.login}</div>
            <div className="text-xs text-[#94a3b8]">@{data.login} · {data.publicRepos} repos</div>
          </div>
          <button onClick={() => fetch_(username)} disabled={loading} className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Recent commits */}
        <div className="px-4 pt-3 pb-2">
          <div className="text-xs text-[#475569] mb-2 font-medium uppercase tracking-wide">最近提交</div>
          {data.recentPushes.length === 0 ? (
            <p className="text-xs text-[#475569]">無最近提交</p>
          ) : (
            <div className="space-y-2">
              {data.recentPushes.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <GitCommitHorizontal size={13} className="text-[#3b82f6] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-[#94a3b8] truncate">{p.repo.split('/')[1] || p.repo}</div>
                    <div className="text-xs text-[#e2e8f0] truncate">{p.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top repos */}
        <div className="px-4 pt-2 pb-3">
          <div className="text-xs text-[#475569] mb-2 font-medium uppercase tracking-wide">最近更新</div>
          <div className="space-y-1.5">
            {data.topRepos.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: LANG_COLOR[r.language] || '#64748b' }} />
                <span className="text-xs text-[#e2e8f0] flex-1 truncate">{r.name}</span>
                <div className="flex items-center gap-1 text-xs text-[#475569]">
                  <Star size={11} />
                  {r.stars}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[#334155]">
        <button onClick={() => { setUsername(''); setData(null) }} className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
          更換帳號
        </button>
      </div>
    </div>
  )
}
