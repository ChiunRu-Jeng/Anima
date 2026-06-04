'use client'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function Card({ title, icon, action, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#334155] bg-[#1e293b] flex flex-col overflow-hidden',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
          <div className="flex items-center gap-2 text-sm font-medium text-[#cbd5e1]">
            {icon}
            {title}
          </div>
          {action}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
