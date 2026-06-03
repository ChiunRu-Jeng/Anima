'use client'
import { useState, useEffect } from 'react'
import { Plus, Target, Pencil, Trash2 } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId, formatDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { Goal } from '@/types'

const CATEGORY_LABEL = { weekly: '本週', monthly: '本月', 'long-term': '長期' }
const CATEGORY_COLOR = { weekly: '#3b82f6', monthly: '#a855f7', 'long-term': '#f59e0b' }

export default function GoalWidget() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState({ title: '', target: '', current: '', unit: '', category: 'monthly' as Goal['category'], deadline: '' })

  useEffect(() => { setGoals(getItem<Goal[]>('goals', [])) }, [])

  const save = (next: Goal[]) => { setGoals(next); setItem('goals', next) }

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', target: '', current: '0', unit: '', category: 'monthly', deadline: '' })
    setOpen(true)
  }

  const openEdit = (g: Goal) => {
    setEditing(g)
    setForm({ title: g.title, target: String(g.target), current: String(g.current), unit: g.unit, category: g.category, deadline: g.deadline || '' })
    setOpen(true)
  }

  const submit = () => {
    if (!form.title.trim() || !form.target) return
    if (editing) {
      save(goals.map((g) => g.id === editing.id ? { ...g, ...form, target: Number(form.target), current: Number(form.current) } : g))
    } else {
      save([...goals, { id: generateId(), ...form, target: Number(form.target), current: Number(form.current), createdAt: new Date().toISOString() }])
    }
    setOpen(false)
  }

  const remove = (id: string) => save(goals.filter((g) => g.id !== id))

  const updateProgress = (id: string, delta: number) => {
    save(goals.map((g) => g.id === id ? { ...g, current: Math.max(0, Math.min(g.target, g.current + delta)) } : g))
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
          {goals.length === 0 && (
            <p className="text-center text-[#475569] text-sm py-6">設定你的目標吧！</p>
          )}
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))
            const color = CATEGORY_COLOR[goal.category]
            return (
              <div key={goal.id} className="group p-3 rounded-xl bg-[#0f172a] border border-[#334155] hover:border-[#475569] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-[#e2e8f0]">{goal.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: color + '22', color }}>
                        {CATEGORY_LABEL[goal.category]}
                      </span>
                      {goal.deadline && (
                        <span className="text-xs text-[#475569]">至 {formatDate(goal.deadline)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(goal)} className="text-[#475569] hover:text-[#94a3b8]"><Pencil size={13} /></button>
                    <button onClick={() => remove(goal.id)} className="text-[#475569] hover:text-[#ef4444]"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 bg-[#1e293b] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-xs text-[#94a3b8] w-8 text-right">{pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#475569]">{goal.current} / {goal.target} {goal.unit}</span>
                  <div className="flex gap-1">
                    {[1, 5, 10].map((n) => (
                      <button key={n} onClick={() => updateProgress(goal.id, n)}
                        className="text-xs px-2 py-0.5 rounded bg-[#1e293b] hover:bg-[#243447] text-[#94a3b8] transition-colors">
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#334155]">
          <button onClick={openAdd} className="w-full flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#243447] rounded-lg py-2 transition-colors">
            <Plus size={14} /> 新增目標
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? '編輯目標' : '新增目標'}>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="目標名稱" className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} placeholder="目前" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
            <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="目標值" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="單位" className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['weekly', 'monthly', 'long-term'] as const).map((c) => (
              <button key={c} onClick={() => setForm({ ...form, category: c })}
                className="text-sm py-2 rounded-lg border transition-all"
                style={{ background: form.category === c ? CATEGORY_COLOR[c] + '22' : 'transparent', borderColor: form.category === c ? CATEGORY_COLOR[c] : '#334155', color: form.category === c ? CATEGORY_COLOR[c] : '#94a3b8' }}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]" />
          <button onClick={submit} disabled={!form.title.trim() || !form.target}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">
            {editing ? '儲存' : '新增'}
          </button>
        </div>
      </Modal>
    </>
  )
}
