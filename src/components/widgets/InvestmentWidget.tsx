'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId, formatCurrency } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { Investment } from '@/types'

interface InvestmentWithPrice extends Investment {
  currentPrice?: number
  totalCost: number
  totalValue?: number
  gainLoss?: number
  gainLossPct?: number
}

export default function InvestmentWidget() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ symbol: '', name: '', shares: '', avgCost: '', currency: 'USD' as 'USD' | 'TWD' })

  useEffect(() => { setInvestments(getItem<Investment[]>('investments', [])) }, [])

  const fetchPrices = useCallback(async (invs: Investment[]) => {
    if (invs.length === 0) return
    setLoading(true)
    try {
      const symbols = invs.map((i) => i.symbol)
      const res = await fetch(`/api/stocks?symbols=${symbols.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, number> = {}
        for (const q of data) if (!q.error && q.price) map[q.symbol] = q.price
        setPrices(map)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (investments.length > 0) fetchPrices(investments) }, [investments, fetchPrices])

  const enriched: InvestmentWithPrice[] = investments.map((inv) => {
    const currentPrice = prices[inv.symbol]
    const totalCost = inv.shares * inv.avgCost
    const totalValue = currentPrice ? inv.shares * currentPrice : undefined
    const gainLoss = totalValue !== undefined ? totalValue - totalCost : undefined
    const gainLossPct = gainLoss !== undefined && totalCost > 0 ? (gainLoss / totalCost) * 100 : undefined
    return { ...inv, currentPrice, totalCost, totalValue, gainLoss, gainLossPct }
  })

  const totalValue = enriched.reduce((s, i) => s + (i.totalValue ?? i.totalCost), 0)
  const totalCost = enriched.reduce((s, i) => s + i.totalCost, 0)
  const totalGain = totalValue - totalCost

  const add = () => {
    if (!form.symbol || !form.shares || !form.avgCost) return
    const next = [...investments, { id: generateId(), ...form, shares: Number(form.shares), avgCost: Number(form.avgCost) }]
    setInvestments(next)
    setItem('investments', next)
    setForm({ symbol: '', name: '', shares: '', avgCost: '', currency: 'USD' })
    setOpen(false)
    fetchPrices(next)
  }

  const remove = (id: string) => {
    const next = investments.filter((i) => i.id !== id)
    setInvestments(next)
    setItem('investments', next)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-[#f1f5f9] tabular-nums">
                {formatCurrency(totalValue, 'USD')}
              </div>
              <div className={`text-sm flex items-center gap-1 ${totalGain >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {totalGain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, 'USD')} ({totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : '0.00'}%)
              </div>
            </div>
            <button onClick={() => fetchPrices(investments)} disabled={loading} className="text-[#94a3b8] hover:text-[#f1f5f9] disabled:opacity-40 transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {enriched.length === 0 ? (
            <p className="text-center text-[#475569] text-sm py-6">新增持倉開始追蹤</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#475569] text-xs border-b border-[#334155]">
                  <th className="text-left px-4 py-2 font-normal">代號</th>
                  <th className="text-right px-4 py-2 font-normal">數量</th>
                  <th className="text-right px-4 py-2 font-normal">損益%</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {enriched.map((inv) => {
                  const up = (inv.gainLossPct ?? 0) >= 0
                  return (
                    <tr key={inv.id} className="border-b border-[#1e293b] hover:bg-[#243447] transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-[#e2e8f0]">{inv.symbol}</div>
                        <div className="text-xs text-[#475569]">{inv.name || inv.currency}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="text-[#e2e8f0] tabular-nums">{inv.shares}</div>
                        <div className="text-xs text-[#475569] tabular-nums">均 {inv.avgCost}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {inv.gainLossPct !== undefined ? (
                          <span className={`tabular-nums ${up ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {up ? '+' : ''}{inv.gainLossPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[#475569] text-xs">—</span>
                        )}
                      </td>
                      <td className="pr-2">
                        <button onClick={() => remove(inv.id)} className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#334155]">
          <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#243447] rounded-lg py-2 transition-colors">
            <Plus size={14} /> 新增持倉
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新增持倉">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="代號 (e.g. AAPL)" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="名稱（選填）" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} placeholder="股數/數量" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
            <input type="number" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} placeholder="平均成本" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          </div>
          <div className="flex gap-2">
            {(['USD', 'TWD'] as const).map((c) => (
              <button key={c} onClick={() => setForm({ ...form, currency: c })}
                className="flex-1 text-sm py-2 rounded-lg border transition-all"
                style={{ background: form.currency === c ? '#3b82f622' : 'transparent', borderColor: form.currency === c ? '#3b82f6' : '#334155', color: form.currency === c ? '#3b82f6' : '#94a3b8' }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={add} disabled={!form.symbol || !form.shares || !form.avgCost} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">新增</button>
        </div>
      </Modal>
    </>
  )
}
