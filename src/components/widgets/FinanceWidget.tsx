'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getItem, setItem } from '@/lib/storage'
import { generateId, formatCurrency } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { Expense, ExpenseCategory, Budget } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['餐飲', '交通', '娛樂', '購物', '醫療', '教育', '居住', '其他']
const CAT_COLORS: Record<ExpenseCategory, string> = {
  餐飲: '#f97316', 交通: '#3b82f6', 娛樂: '#a855f7',
  購物: '#ec4899', 醫療: '#ef4444', 教育: '#22c55e',
  居住: '#f59e0b', 其他: '#64748b',
}
const DEFAULT_BUDGETS: Budget[] = CATEGORIES.map((c) => ({ category: c, limit: 10000 }))

type Tab = 'overview' | 'expenses' | 'budget'

export default function FinanceWidget() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS)
  const [tab, setTab] = useState<Tab>('overview')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', category: '餐飲' as ExpenseCategory, description: '', date: new Date().toISOString().split('T')[0] })
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    setExpenses(getItem<Expense[]>('expenses', []))
    setBudgets(getItem<Budget[]>('budgets', DEFAULT_BUDGETS))
  }, [])

  const targetMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [monthOffset])

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(targetMonth)),
    [expenses, targetMonth]
  )

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of monthExpenses) {
      map[e.category] = (map[e.category] || 0) + e.amount
    }
    return CATEGORIES.map((c) => ({ name: c, value: map[c] || 0, color: CAT_COLORS[c] })).filter((i) => i.value > 0)
  }, [monthExpenses])

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const addExpense = () => {
    if (!form.amount || isNaN(Number(form.amount))) return
    const next = [...expenses, { id: generateId(), ...form, amount: Number(form.amount) }]
    setExpenses(next)
    setItem('expenses', next)
    setForm({ ...form, amount: '', description: '' })
    setOpen(false)
  }

  const removeExpense = (id: string) => {
    const next = expenses.filter((e) => e.id !== id)
    setExpenses(next)
    setItem('expenses', next)
  }

  const saveBudget = (category: ExpenseCategory, limit: number) => {
    const next = budgets.map((b) => b.category === category ? { ...b, limit } : b)
    setBudgets(next)
    setItem('budgets', next)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-[#334155]">
          {(['overview', 'expenses', 'budget'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 text-xs py-2.5 transition-colors ${tab === t ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
              {t === 'overview' ? '概覽' : t === 'expenses' ? '支出' : '預算'}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="text-[#94a3b8] hover:text-[#f1f5f9]"><ChevronLeft size={16} /></button>
          <span className="text-xs text-[#94a3b8]">{targetMonth}</span>
          <button onClick={() => setMonthOffset((m) => Math.min(0, m + 1))} disabled={monthOffset === 0} className="text-[#94a3b8] hover:text-[#f1f5f9] disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === 'overview' && (
            <div className="p-4">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-[#f1f5f9]">{formatCurrency(total)}</div>
                <div className="text-xs text-[#94a3b8]">本月支出</div>
              </div>
              {byCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                        {byCategory.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {byCategory.sort((a, b) => b.value - a.value).map((c) => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="text-xs text-[#94a3b8] flex-1">{c.name}</span>
                        <span className="text-xs text-[#e2e8f0] tabular-nums">{formatCurrency(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-[#475569] text-sm py-4">本月無支出記錄</p>
              )}
            </div>
          )}

          {tab === 'expenses' && (
            <div>
              {monthExpenses.length === 0 ? (
                <p className="text-center text-[#475569] text-sm py-6">無記錄</p>
              ) : (
                monthExpenses.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                  <div key={e.id} className="group flex items-center gap-3 px-4 py-2.5 border-b border-[#334155] hover:bg-[#243447] transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[e.category] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#e2e8f0] truncate">{e.description || e.category}</div>
                      <div className="text-xs text-[#475569]">{e.date} · {e.category}</div>
                    </div>
                    <span className="text-sm text-[#f1f5f9] tabular-nums">{formatCurrency(e.amount)}</span>
                    <button onClick={() => removeExpense(e.id)} className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all"><Trash2 size={13} /></button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'budget' && (
            <div className="p-4 space-y-2">
              {CATEGORIES.map((cat) => {
                const spent = monthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0)
                const budget = budgets.find((b) => b.category === cat)?.limit || 0
                const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                const over = spent > budget && budget > 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#e2e8f0]">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tabular-nums ${over ? 'text-[#ef4444]' : 'text-[#94a3b8]'}`}>{formatCurrency(spent)}</span>
                        <span className="text-xs text-[#475569]">/</span>
                        <input type="number" defaultValue={budget} onBlur={(e) => saveBudget(cat, Number(e.target.value))}
                          className="w-20 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-xs rounded px-2 py-0.5 outline-none focus:border-[#3b82f6] tabular-nums text-right" />
                      </div>
                    </div>
                    <div className="bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#ef4444' : CAT_COLORS[cat] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#334155]">
          <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#243447] rounded-lg py-2 transition-colors">
            <Plus size={14} /> 記錄支出
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="記錄支出">
        <div className="space-y-3">
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="金額 (TWD)" className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="描述（選填）" className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <button onClick={addExpense} disabled={!form.amount} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">記錄</button>
        </div>
      </Modal>
    </>
  )
}
