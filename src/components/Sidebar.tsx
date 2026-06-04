import { Stock, Industry, FetchStatus } from '../types';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  stocks: Stock[];
  allStocks: Stock[];
  selectedSymbols: string[];
  selectedIndustries: Industry[];
  fetchStatus: Record<string, FetchStatus>;
  colors: Record<string, string>;
  onToggleSymbol: (symbol: string) => void;
  onToggleIndustry: (industry: Industry) => void;
}

const INDUSTRIES: Industry[] = ['加權指數', '科技股', '金融股', '傳產股', '生技股', 'ETF'];

const INDUSTRY_COLORS: Record<Industry, string> = {
  '加權指數': 'text-amber-400 border-amber-400',
  '科技股':   'text-blue-400 border-blue-400',
  '金融股':   'text-teal-400 border-teal-400',
  '傳產股':   'text-orange-400 border-orange-400',
  '生技股':   'text-green-400 border-green-400',
  'ETF':      'text-purple-400 border-purple-400',
};

function StatusIcon({ status }: { status?: FetchStatus }) {
  if (!status || status === 'idle') return null;
  if (status === 'loading') return <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />;
  if (status === 'error') return <AlertCircle size={12} className="text-red-400 shrink-0" />;
  if (status === 'success') return <CheckCircle2 size={12} className="text-green-400 shrink-0 opacity-60" />;
  return null;
}

export default function Sidebar({
  stocks,
  allStocks,
  selectedSymbols,
  selectedIndustries,
  fetchStatus,
  colors,
  onToggleSymbol,
  onToggleIndustry,
}: SidebarProps) {
  // Group visible stocks by industry
  const grouped = INDUSTRIES.reduce<Record<string, Stock[]>>((acc, ind) => {
    acc[ind] = stocks.filter(s => s.industry === ind);
    return acc;
  }, {});

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Industry filter pills */}
      <div className="p-3 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">產業篩選</p>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map(ind => {
            const active = selectedIndustries.includes(ind);
            const cls = INDUSTRY_COLORS[ind] ?? 'text-gray-400 border-gray-400';
            return (
              <button
                key={ind}
                onClick={() => onToggleIndustry(ind)}
                className={`px-2 py-0.5 text-xs rounded border font-medium transition-all ${
                  active
                    ? `${cls} bg-opacity-20 bg-current`
                    : 'text-gray-600 border-gray-700 hover:border-gray-500 hover:text-gray-400'
                }`}
              >
                {ind}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {INDUSTRIES.map(ind => {
          if (!selectedIndustries.includes(ind)) return null;
          const group = grouped[ind] ?? [];
          if (group.length === 0) return null;
          return (
            <div key={ind}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 px-1 ${INDUSTRY_COLORS[ind]?.split(' ')[0] ?? 'text-gray-500'}`}>
                {ind}
              </p>
              <ul className="space-y-0.5">
                {group.map(stock => {
                  const selected = selectedSymbols.includes(stock.symbol);
                  const color = colors[stock.symbol] ?? '#6B7280';
                  const status = fetchStatus[stock.symbol];
                  return (
                    <li key={stock.symbol}>
                      <button
                        onClick={() => onToggleSymbol(stock.symbol)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                          selected
                            ? 'bg-gray-800 hover:bg-gray-700'
                            : 'hover:bg-gray-800/60 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {/* Color dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: selected ? color : '#374151' }}
                        />
                        {/* Symbol + name */}
                        <span className="flex-1 min-w-0">
                          <span className={`text-xs font-mono ${selected ? 'text-gray-300' : 'text-gray-600'}`}>
                            {stock.symbol === '^TWII' ? 'TWII' : stock.symbol}
                          </span>
                          <span className={`ml-1 text-xs ${selected ? 'text-gray-100' : 'text-gray-500'}`}>
                            {stock.name}
                          </span>
                        </span>
                        {/* Status icon */}
                        {selected && <StatusIcon status={status} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Selected count */}
      <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        已選 {selectedSymbols.length} / {allStocks.length} 支
      </div>
    </aside>
  );
}
