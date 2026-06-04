import { StockData } from '../types';
import { STOCKS } from '../data/stocks';
import { formatPrice } from '../utils/chart';

interface LegendContentProps {
  selectedSymbols: string[];
  stockDataMap: Record<string, StockData>;
  colors: Record<string, string>;
  normalise: boolean;
}

const stockNameMap = Object.fromEntries(STOCKS.map(s => [s.symbol, s.name]));

export default function LegendContent({
  selectedSymbols,
  stockDataMap,
  colors,
  normalise,
}: LegendContentProps) {
  if (selectedSymbols.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2 px-4">
      {selectedSymbols.map(symbol => {
        const data = stockDataMap[symbol];
        const color = colors[symbol] ?? '#6B7280';
        const name = stockNameMap[symbol] ?? symbol;
        const price = data?.latestPrice;
        const currency = data?.currency ?? 'TWD';
        const hasError = !!data?.error;

        return (
          <span key={symbol} className="flex items-center gap-1.5 text-xs">
            <span className="w-5 h-0.5 inline-block rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-300 font-medium">{name}</span>
            {hasError ? (
              <span className="text-red-400 text-xs">載入失敗</span>
            ) : price !== null && price !== undefined ? (
              <span className="font-mono text-gray-400 tabular-nums">
                {normalise ? '' : formatPrice(price, currency)}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
