import { CheckSquare, Flame, Target, CloudSun, TrendingUp, Wallet, BookMarked, GitBranch, Calendar, BarChart3 } from 'lucide-react'
import Card from '@/components/ui/Card'
import ClockWidget from '@/components/widgets/ClockWidget'
import WeatherWidget from '@/components/widgets/WeatherWidget'
import TodoWidget from '@/components/widgets/TodoWidget'
import HabitWidget from '@/components/widgets/HabitWidget'
import GoalWidget from '@/components/widgets/GoalWidget'
import StockWidget from '@/components/widgets/StockWidget'
import FinanceWidget from '@/components/widgets/FinanceWidget'
import InvestmentWidget from '@/components/widgets/InvestmentWidget'
import ArticleWidget from '@/components/widgets/ArticleWidget'
import GitHubWidget from '@/components/widgets/GitHubWidget'
import CalendarWidget from '@/components/widgets/CalendarWidget'

export default function Dashboard() {
  return (
    <main className="min-h-screen p-4 lg:p-6" style={{ background: '#0f172a' }}>
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Row 1: Top bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-28 rounded-xl border border-[#334155] bg-[#1e293b]">
            <ClockWidget />
          </div>
          <Card className="h-28" icon={<CloudSun size={14} />} title="天氣">
            <WeatherWidget />
          </Card>
          <div className="h-28 rounded-xl border border-[#334155] bg-[#1e293b] flex items-center justify-between px-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3b82f6]">今日</div>
              <div className="text-xs text-[#94a3b8] mt-1">待辦事項</div>
            </div>
            <div className="w-px h-10 bg-[#334155]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#f97316]">習慣</div>
              <div className="text-xs text-[#94a3b8] mt-1">連續追蹤</div>
            </div>
            <div className="w-px h-10 bg-[#334155]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#22c55e]">目標</div>
              <div className="text-xs text-[#94a3b8] mt-1">進行中</div>
            </div>
          </div>
        </div>

        {/* Row 2: Productivity + Finance + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Productivity column */}
          <div className="space-y-4">
            <Card className="h-72" icon={<CheckSquare size={14} />} title="待辦事項">
              <TodoWidget />
            </Card>
            <Card className="h-64" icon={<Flame size={14} />} title="習慣追蹤">
              <HabitWidget />
            </Card>
          </div>

          {/* Finance column */}
          <div className="space-y-4">
            <Card className="h-[360px]" icon={<Wallet size={14} />} title="財務追蹤">
              <FinanceWidget />
            </Card>
            <Card className="h-[172px]" icon={<BarChart3 size={14} />} title="投資組合">
              <InvestmentWidget />
            </Card>
          </div>

          {/* Info column */}
          <div className="space-y-4">
            <Card className="h-72" icon={<BookMarked size={14} />} title="文章收藏">
              <ArticleWidget />
            </Card>
            <Card className="h-64" icon={<Target size={14} />} title="目標管理">
              <GoalWidget />
            </Card>
          </div>
        </div>

        {/* Row 3: Market + GitHub + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="h-72" icon={<TrendingUp size={14} />} title="自選行情">
            <StockWidget />
          </Card>
          <Card className="h-72" icon={<GitBranch size={14} />} title="GitHub">
            <GitHubWidget />
          </Card>
          <Card className="h-72" icon={<Calendar size={14} />} title="日曆">
            <CalendarWidget />
          </Card>
        </div>

      </div>
    </main>
  )
}
