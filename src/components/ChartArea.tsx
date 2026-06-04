import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartDataPoint, StockData, FetchStatus, Interval } from '../types';
import { STOCKS } from '../data/stocks';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import CustomTooltip from './CustomTooltip';
import LegendContent from './LegendContent';

interface ChartAreaProps {
  chartData: ChartDataPoint[];
  selectedSymbols: string[];
  stockDataMap: Record<string, StockData>;
  fetchStatus: Record<string, FetchStatus>;
  colors: Record<string, string>;
  normalise: boolean;
  interval: Interval;
}

const stockNameMap = Object.fromEntries(STOCKS.map(s => [s.symbol, s.name]));

function tickFormatter(value: string) {
  if (!value) return '';
  return value.slice(0, 7); // "YYYY-MM"
}

export default function ChartArea({
  chartData,
  selectedSymbols,
  stockDataMap,
  fetchStatus,
  colors,
  normalise,
  interval,
}: ChartAreaProps) {
  const loadingSymbols = selectedSymbols.filter(s => fetchStatus[s] === 'loading');
  const errorSymbols = selectedSymbols.filter(s => fetchStatus[s] === 'error');

  const hasData = chartData.length > 0;

  // Determine tick count based on data range
  const tickCount = useMemo(() => {
    if (chartData.length === 0) return 6;
    if (interval === '1mo') return Math.min(chartData.length, 20);
    if (interval === '1wk') return Math.min(chartData.length, 15);
    return Math.min(chartData.length, 10);
  }, [chartData.length, interval]);

  // Sample ticks evenly
  const ticks = useMemo(() => {
    if (chartData.length === 0) return [];
    const step = Math.max(1, Math.floor(chartData.length / tickCount));
    return chartData
      .filter((_, i) => i % step === 0)
      .map(d => d.date);
  }, [chartData, tickCount]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 p-4 gap-3">
      {/* Status bar */}
      {(loadingSymbols.length > 0 || errorSymbols.length > 0) && (
        <div className="flex items-center gap-4 text-xs shrink-0">
          {loadingSymbols.length > 0 && (
            <span className="flex items-center gap-1.5 text-blue-400">
              <Loader2 size={13} className="animate-spin" />
              載入中：{loadingSymbols.map(s => stockNameMap[s] ?? s).join(', ')}
            </span>
          )}
          {errorSymbols.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertCircle size={13} />
              載入失敗：{errorSymbols.map(s => stockNameMap[s] ?? s).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasData && loadingSymbols.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
          <TrendingUp size={48} strokeWidth={1} />
          <p className="text-lg">請從左側選擇股票</p>
          <p className="text-sm">可多選不同產業股票進行比較</p>
        </div>
      )}

      {/* Chart */}
      {(hasData || loadingSymbols.length > 0) && (
        <div className="flex-1 min-h-0">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis
                  dataKey="date"
                  ticks={ticks}
                  tickFormatter={tickFormatter}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v =>
                    normalise ? `${v > 0 ? '+' : ''}${v}%` : v.toLocaleString()
                  }
                  width={normalise ? 58 : 72}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      selectedSymbols={selectedSymbols}
                      stockDataMap={stockDataMap}
                      colors={colors}
                      normalise={normalise}
                    />
                  }
                />
                <Legend
                  content={
                    <LegendContent
                      selectedSymbols={selectedSymbols}
                      stockDataMap={stockDataMap}
                      colors={colors}
                      normalise={normalise}
                    />
                  }
                />
                {selectedSymbols.map(symbol => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={symbol}
                    stroke={colors[symbol] ?? '#6B7280'}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={stockNameMap[symbol] ?? symbol}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
