import { StockData } from '../types';
import { STOCKS } from '../data/stocks';
import { formatDate, formatPrice } from '../utils/chart';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number | null;
    color: string;
  }>;
  label?: string;
  selectedSymbols: string[];
  stockDataMap: Record<string, StockData>;
  colors: Record<string, string>;
  normalise: boolean;
}

const stockNameMap = Object.fromEntries(STOCKS.map(s => [s.symbol, s.name]));

export default function CustomTooltip({
  active,
  payload,
  label,
  selectedSymbols,
  stockDataMap,
  colors,
  normalise,
}: CustomTooltipProps) {
  if (!active || !payload || !label) return null;

  const payloadMap: Record<string, number | null> = {};
  for (const p of payload) {
    payloadMap[p.dataKey] = p.value;
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-3 min-w-[180px] text-xs">
      <p className="text-gray-400 font-medium mb-2 border-b border-gray-700 pb-1">
        {formatDate(label)}
      </p>
      <ul className="space-y-1">
        {selectedSymbols.map(symbol => {
          const val = payloadMap[symbol];
          const color = colors[symbol] ?? '#6B7280';
          const name = stockNameMap[symbol] ?? symbol;
          const currency = stockDataMap[symbol]?.currency ?? 'TWD';

          let displayVal: string;
          if (val === null || val === undefined) {
            displayVal = '—';
          } else if (normalise) {
            displayVal = `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
          } else {
            displayVal = formatPrice(val, currency);
          }

          return (
            <li key={symbol} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-gray-300">{name}</span>
              </span>
              <span
                className="font-mono font-medium tabular-nums"
                style={{ color: val === null ? '#6B7280' : normalise && val !== 0 ? (val > 0 ? '#34D399' : '#F87171') : color }}
              >
                {displayVal}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
