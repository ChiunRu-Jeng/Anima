'use client'
import { useEffect, useState } from 'react'

export default function ClockWidget() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
      setDate(
        now.toLocaleDateString('zh-TW', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col justify-center px-5 py-4 h-full">
      <div className="text-4xl font-bold text-[#f1f5f9] tabular-nums">{time}</div>
      <div className="text-sm text-[#94a3b8] mt-1">{date}</div>
    </div>
  )
}
