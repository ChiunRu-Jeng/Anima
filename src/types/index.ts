export type Industry = '加權指數' | '科技股' | '金融股' | '傳產股' | '生技股' | 'ETF';

export type Interval = '1d' | '1wk' | '1mo';

export interface Stock {
  symbol: string;
  name: string;
  industry: Industry;
  yahooSymbol: string;
}

export interface PricePoint {
  date: string;       // ISO date string
  timestamp: number;  // Unix seconds
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface StockData {
  symbol: string;
  name: string;
  currency: string;
  prices: PricePoint[];
  latestPrice: number | null;
  error?: string;
}

export type ChartDataPoint = {
  date: string;
  timestamp: number;
  [symbol: string]: number | string | null;
};

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface StockFetchState {
  status: FetchStatus;
  error?: string;
}
