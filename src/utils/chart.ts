import { StockData, ChartDataPoint } from '../types';

/**
 * Merges multiple StockData arrays into a single array of ChartDataPoints,
 * keyed by date. Each point contains a field per symbol with that symbol's close price.
 * Also normalises values to percentage-change-from-first-data-point so stocks
 * with very different price scales can be compared.
 */
export function mergeStockData(
  stockDataMap: Record<string, StockData>,
  selectedSymbols: string[],
  normalise: boolean = false
): ChartDataPoint[] {
  if (selectedSymbols.length === 0) return [];

  // Build a map: date -> { symbol -> close }
  const dateMap: Map<string, Record<string, number>> = new Map();

  for (const symbol of selectedSymbols) {
    const data = stockDataMap[symbol];
    if (!data || data.error) continue;
    for (const point of data.prices) {
      if (point.close === null) continue;
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {});
      }
      dateMap.get(point.date)![symbol] = point.close;
    }
  }

  // Sort by date
  const sortedDates = Array.from(dateMap.keys()).sort();

  if (!normalise) {
    return sortedDates.map(date => {
      const record = dateMap.get(date)!;
      const point: ChartDataPoint = { date, timestamp: new Date(date).getTime() };
      for (const symbol of selectedSymbols) {
        point[symbol] = record[symbol] ?? null;
      }
      return point;
    });
  }

  // Find first available close per symbol for normalisation
  const firstClose: Record<string, number> = {};
  for (const symbol of selectedSymbols) {
    for (const date of sortedDates) {
      const val = dateMap.get(date)?.[symbol];
      if (val !== undefined && val !== null) {
        firstClose[symbol] = val;
        break;
      }
    }
  }

  return sortedDates.map(date => {
    const record = dateMap.get(date)!;
    const point: ChartDataPoint = { date, timestamp: new Date(date).getTime() };
    for (const symbol of selectedSymbols) {
      const raw = record[symbol];
      const base = firstClose[symbol];
      if (raw !== undefined && base && base !== 0) {
        point[symbol] = parseFloat((((raw - base) / base) * 100).toFixed(2));
      } else {
        point[symbol] = null;
      }
    }
    return point;
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function formatPrice(price: number | null | undefined, currency = 'TWD'): string {
  if (price === null || price === undefined) return 'N/A';
  if (currency === 'TWD') {
    return price.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(2);
}
