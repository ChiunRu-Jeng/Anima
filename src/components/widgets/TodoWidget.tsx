'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Flag } from 'lucide-react'
import { getItem, setItem } from '@/lib/storage'
import { generateId, formatDate } from '@/lib/utils'
import type { Todo } from '@/types'

const PRIORITY_COLOR = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<Todo['priority']>('medium')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    setTodos(getItem<Todo[]>('todos', []))
  }, [])

  const save = (next: Todo[]) => {
    setTodos(next)
    setItem('todos', next)
  }

  const add = () => {
    if (!input.trim()) return
    save([
      {
        id: generateId(),
        text: input.trim(),
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
      },
      ...todos,
    ])
    setInput('')
  }

  const toggle = (id: string) =>
    save(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))

  const remove = (id: string) => save(todos.filter((t) => t.id !== id))

  const active = todos.filter((t) => !t.completed)
  const done = todos.filter((t) => t.completed)

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="新增任務…"
            className="flex-1 bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6] placeholder:text-[#475569]"
          />
          <div className="flex gap-1">
            {(['high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: priority === p ? PRIORITY_COLOR[p] + '33' : 'transparent',
                  border: `1px solid ${priority === p ? PRIORITY_COLOR[p] : '#334155'}`,
                }}
              >
                <Flag size={12} style={{ color: PRIORITY_COLOR[p] }} />
              </button>
            ))}
          </div>
          <button
            onClick={add}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg px-3 py-2 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2 space-y-1">
        {active.length === 0 && (
          <p className="text-center text-[#475569] text-sm py-4">沒有待辦事項 🎉</p>
        )}
        {active.map((todo) => (
          <TodoRow key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
        ))}

        {done.length > 0 && (
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors w-full text-left py-1"
          >
            {showDone ? '▾' : '▸'} 已完成 ({done.length})
          </button>
        )}
        {showDone &&
          done.map((todo) => (
            <TodoRow key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
          ))}
      </div>

      <div className="px-4 py-2 border-t border-[#334155] text-xs text-[#475569]">
        {active.length} 項待辦 · {done.length} 項完成
      </div>
    </div>
  )
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#243447] transition-colors">
      <button onClick={() => onToggle(todo.id)} className="shrink-0">
        {todo.completed ? (
          <CheckCircle2 size={18} className="text-[#22c55e]" />
        ) : (
          <Circle size={18} style={{ color: PRIORITY_COLOR[todo.priority] }} />
        )}
      </button>
      <span
        className={`flex-1 text-sm ${todo.completed ? 'line-through text-[#475569]' : 'text-[#e2e8f0]'}`}
      >
        {todo.text}
      </span>
      {todo.dueDate && (
        <span className="text-xs text-[#475569]">{formatDate(todo.dueDate)}</span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#ef4444] transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
