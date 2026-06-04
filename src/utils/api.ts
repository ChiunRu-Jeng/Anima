import { PricePoint, StockData } from '../types';

const CORS_PROXY = 'https://corsproxy.io/?';
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

function buildUrl(yahooSymbol: string, interval: string): string {
  const encoded = encodeURIComponent(`${YAHOO_BASE}/${yahooSymbol}?interval=${interval}&range=max`);
  return `${CORS_PROXY}${encoded}`;
}

function buildDirectUrl(yahooSymbol: string, interval: string): string {
  return `${YAHOO_BASE}/${yahooSymbol}?interval=${interval}&range=max`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYahooResponse(data: any, symbol: string, name: string): StockData {
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error('No data returned from Yahoo Finance');
  }

  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const opens: (number | null)[] = quote.open ?? [];
  const highs: (number | null)[] = quote.high ?? [];
  const lows: (number | null)[] = quote.low ?? [];
  const closes: (number | null)[] = quote.close ?? [];
  const volumes: (number | null)[] = quote.volume ?? [];
  const currency: string = result.meta?.currency ?? 'TWD';

  const prices: PricePoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (ts == null || isNaN(ts) || close == null) continue;
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) continue;
    prices.push({
      date: d.toISOString().split('T')[0],
      timestamp: ts,
      open: opens[i] ?? null,
      high: highs[i] ?? null,
      low: lows[i] ?? null,
      close,
      volume: volumes[i] ?? null,
    });
  }

  let latestClose: number | null = null;
  for (let i = closes.length - 1; i >= 0; i--) {
    const c = closes[i];
    if (c != null) { latestClose = c; break; }
  }

  return {
    symbol,
    name,
    currency,
    prices,
    latestPrice: latestClose,
  };
}

async function fetchWithFallback(url: string, proxyUrl: string): Promise<Response> {
  try {
    const res = await fetch(url);
    if (res.ok) return res;
    throw new Error(`HTTP ${res.status}`);
  } catch {
    // fallback to proxy
    const res = await fetch(proxyUrl);
    if (res.ok) return res;
    throw new Error(`Proxy fetch failed: HTTP ${res.status}`);
  }
}

export async function fetchStockData(
  yahooSymbol: string,
  symbol: string,
  name: string,
  interval: string
): Promise<StockData> {
  const directUrl = buildDirectUrl(yahooSymbol, interval);
  const proxyUrl = buildUrl(yahooSymbol, interval);

  try {
    const res = await fetchWithFallback(directUrl, proxyUrl);
    const data = await res.json();

    const error = data?.chart?.error;
    if (error) {
      throw new Error(error.description ?? 'Unknown Yahoo Finance error');
    }

    return parseYahooResponse(data, symbol, name);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      symbol,
      name,
      currency: 'TWD',
      prices: [],
      latestPrice: null,
      error: message,
    };
  }
}
