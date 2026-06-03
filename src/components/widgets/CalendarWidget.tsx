'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarWidget() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toISOString().split('T')[0]

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const prev = () => setViewDate(new Date(year, month - 1, 1))
  const next = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="flex flex-col h-full px-4 py-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium text-[#e2e8f0]">{year} 年 {month + 1} 月</span>
        <button onClick={next} className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"><ChevronRight size={16} /></button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs py-1 ${i === 0 || i === 6 ? 'text-[#ef4444]' : 'text-[#475569]'}`}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1 flex-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const col = idx % 7
          const isWeekend = col === 0 || col === 6
          return (
            <button
              key={day}
              className="flex items-center justify-center h-7 w-7 mx-auto rounded-full text-xs transition-colors"
              style={{
                background: isToday ? '#3b82f6' : 'transparent',
                color: isToday ? '#fff' : isWeekend ? '#ef4444' : '#e2e8f0',
                fontWeight: isToday ? 700 : 400,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-[#334155] text-center">
        <p className="text-xs text-[#475569]">Google Calendar 整合需設定 OAuth</p>
        <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
          開啟 Google Calendar →
        </a>
      </div>
    </div>
  )
}
