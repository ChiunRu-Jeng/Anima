'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, TrendingUp, TrendingDown, X } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'

interface Quote {
  symbol: string
  name?: string
  price?: number
  change?: number
  changePct?: number
  currency?: string
  error?: boolean
}

const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'BTC-USD', 'ETH-USD', '2330.TW']

export default function StockWidget() {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    const saved = getItem<string[]>('watchlist', DEFAULT_WATCHLIST)
    setWatchlist(saved)
  }, [])

  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stocks?symbols=${symbols.join(',')}`)
      if (res.ok) setQuotes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (watchlist.length > 0) fetchQuotes(watchlist)
  }, [watchlist, fetchQuotes])

  const add = () => {
    const sym = input.trim().toUpperCase()
    if (!sym || watchlist.includes(sym)) return
    const next = [...watchlist, sym]
    setWatchlist(next)
    setItem('watchlist', next)
    setInput('')
  }

  const remove = (sym: string) => {
    const next = watchlist.filter((s) => s !== sym)
    setWatchlist(next)
    setItem('watchlist', next)
    setQuotes((q) => q.filter((i) => i.symbol !== sym))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#475569] text-xs border-b border-[#334155]">
              <th className="text-left px-4 py-2 font-normal">代號</th>
              <th className="text-right px-4 py-2 font-normal">價格</th>
              <th className="text-right px-4 py-2 font-normal">漲跌%</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const up = (q.changePct ?? 0) >= 0
              return (
                <tr key={q.symbol} className="border-b border-[#1e293b] hover:bg-[#243447] transition-colors group">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-[#e2e8f0]">{q.symbol}</div>
                    <div className="text-xs text-[#475569] truncate max-w-[100px]">{q.name}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#e2e8f0]">
                    {q.error ? '—' : q.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {q.error ? (
                      <span className="text-[#475569] text-xs">載入失敗</span>
                    ) : (
                      <div className={`flex items-center justify-end gap-1 ${up ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="tabular-nums">{up ? '+' : ''}{q.changePct?.toFixed(2)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="pr-2">
                    <button onClick={() => remove(q.symbol)} className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all">
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-[#334155] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="新增代號 (e.g. NVDA)"
          className="flex-1 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#3b82f6] placeholder:text-[#475569]"
        />
        <button onClick={add} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg px-3 py-1.5 transition-colors">
          <Plus size={14} />
        </button>
        <button onClick={() => fetchQuotes(watchlist)} disabled={loading} className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}
