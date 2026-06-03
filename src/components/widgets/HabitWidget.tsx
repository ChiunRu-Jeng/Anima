'use client'
import { useState, useEffect } from 'react'
import { Plus, Flame, Trash2 } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId, todayISO, getStreak } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import type { Habit } from '@/types'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316']
const EMOJIS = ['💪', '📚', '🏃', '💧', '🧘', '🎨', '✍️', '🎵', '🛌', '🥗', '🚴', '🧠']

function getLast7Days(): string[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

export default function HabitWidget() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💪')
  const [color, setColor] = useState(COLORS[0])
  const days = getLast7Days()
  const today = todayISO()

  useEffect(() => {
    setHabits(getItem<Habit[]>('habits', []))
  }, [])

  const save = (next: Habit[]) => {
    setHabits(next)
    setItem('habits', next)
  }

  const addHabit = () => {
    if (!name.trim()) return
    save([
      ...habits,
      { id: generateId(), name: name.trim(), emoji, color, completions: [], createdAt: new Date().toISOString() },
    ])
    setName('')
    setOpen(false)
  }

  const toggleDay = (id: string, day: string) => {
    save(
      habits.map((h) => {
        if (h.id !== id) return h
        const has = h.completions.includes(day)
        return {
          ...h,
          completions: has ? h.completions.filter((d) => d !== day) : [...h.completions, day],
        }
      })
    )
  }

  const remove = (id: string) => save(habits.filter((h) => h.id !== id))

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
          {habits.length === 0 && (
            <p className="text-center text-[#475569] text-sm py-6">新增習慣開始追蹤吧！</p>
          )}
          {habits.map((habit) => {
            const streak = getStreak(habit.completions)
            const todayDone = habit.completions.includes(today)
            return (
              <div key={habit.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{habit.emoji}</span>
                    <span className="text-sm text-[#e2e8f0]">{habit.name}</span>
                    {streak > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-[#f97316]">
                        <Flame size={12} />
                        <span>{streak}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {days.map((day) => {
                    const done = habit.completions.includes(day)
                    const isToday = day === today
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(habit.id, day)}
                        title={day}
                        className="flex-1 h-7 rounded-md transition-all border"
                        style={{
                          background: done ? habit.color : 'transparent',
                          borderColor: done ? habit.color : isToday ? habit.color + '66' : '#334155',
                          opacity: day > today ? 0.3 : 1,
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between mt-0.5">
                  {days.map((d) => (
                    <span key={d} className="flex-1 text-center text-[10px] text-[#475569]">
                      {new Date(d + 'T00:00:00').toLocaleDateString('zh-TW', { weekday: 'narrow' })}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#334155]">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#243447] rounded-lg py-2 transition-colors"
          >
            <Plus size={14} />
            新增習慣
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="新增習慣">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#94a3b8] mb-1.5 block">名稱</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              placeholder="習慣名稱"
              className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6]"
            />
          </div>
          <div>
            <label className="text-xs text-[#94a3b8] mb-1.5 block">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="text-xl w-9 h-9 rounded-lg transition-all"
                  style={{ background: emoji === e ? '#3b82f633' : 'transparent', border: `1px solid ${emoji === e ? '#3b82f6' : '#334155'}` }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8] mb-1.5 block">顏色</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, outline: color === c ? `3px solid ${c}44` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={addHabit}
            disabled={!name.trim()}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            新增
          </button>
        </div>
      </Modal>
    </>
  )
}
