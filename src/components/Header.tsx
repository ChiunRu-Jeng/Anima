import { TrendingUp, Menu, BarChart2 } from 'lucide-react';
import { Interval } from '../types';

interface HeaderProps {
  interval: Interval;
  onIntervalChange: (i: Interval) => void;
  normalise: boolean;
  onNormaliseChange: (v: boolean) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const INTERVALS: { value: Interval; label: string }[] = [
  { value: '1d', label: '日線' },
  { value: '1wk', label: '周線' },
  { value: '1mo', label: '月線' },
];

export default function Header({
  interval,
  onIntervalChange,
  normalise,
  onNormaliseChange,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0 z-10">
      {/* Left: toggle + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors"
          title={sidebarOpen ? '收起側欄' : '展開側欄'}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400" />
          <span className="font-bold text-white text-lg leading-tight">台灣股市走勢圖</span>
        </div>
      </div>

      {/* Centre: interval buttons */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
        {INTERVALS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onIntervalChange(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              interval === value
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: normalise toggle */}
      <div className="flex items-center gap-2">
        <BarChart2 size={16} className="text-gray-400" />
        <span className="text-sm text-gray-400">漲跌幅比較</span>
        <button
          onClick={() => onNormaliseChange(!normalise)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            normalise ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              normalise ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </header>
  );
}
