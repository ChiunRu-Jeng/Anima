import { useState, useCallback, useRef } from 'react';
import { StockData, Interval, FetchStatus } from '../types';
import { fetchStockData } from '../utils/api';
import { STOCKS } from '../data/stocks';

const stockMap = Object.fromEntries(STOCKS.map(s => [s.symbol, s]));

interface UseStockDataReturn {
  stockDataMap: Record<string, StockData>;
  fetchStatus: Record<string, FetchStatus>;
  loadStocks: (symbols: string[], interval: Interval) => Promise<void>;
  clearData: () => void;
}

export function useStockData(): UseStockDataReturn {
  const [stockDataMap, setStockDataMap] = useState<Record<string, StockData>>({});
  const [fetchStatus, setFetchStatus] = useState<Record<string, FetchStatus>>({});
  // Track which (symbol, interval) combos have been fetched to avoid duplicates
  const fetchedRef = useRef<Set<string>>(new Set());

  const loadStocks = useCallback(async (symbols: string[], interval: Interval) => {
    const toFetch = symbols.filter(sym => {
      const key = `${sym}::${interval}`;
      return !fetchedRef.current.has(key);
    });

    if (toFetch.length === 0) return;

    // Mark as in-flight immediately to prevent duplicate requests from concurrent calls
    for (const sym of toFetch) {
      fetchedRef.current.add(`${sym}::${interval}`);
    }

    // Mark as loading
    setFetchStatus(prev => {
      const next = { ...prev };
      for (const sym of toFetch) next[sym] = 'loading';
      return next;
    });

    // Fetch in parallel (max 4 concurrent)
    const CONCURRENCY = 4;
    for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
      const batch = toFetch.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async symbol => {
          const stock = stockMap[symbol];
          if (!stock) return null;
          const data = await fetchStockData(stock.yahooSymbol, symbol, stock.name, interval);
          return data;
        })
      );

      setStockDataMap(prev => {
        const next = { ...prev };
        for (const data of results) {
          if (data) next[data.symbol] = data;
        }
        return next;
      });

      setFetchStatus(prev => {
        const next = { ...prev };
        results.forEach((data, idx) => {
          if (data) {
            next[data.symbol] = data.error ? 'error' : 'success';
            if (data.error) {
              // Remove in-flight mark on failure so the user can retry
              fetchedRef.current.delete(`${data.symbol}::${interval}`);
            }
          } else {
            // null result means stock lookup failed
            fetchedRef.current.delete(`${batch[idx]}::${interval}`);
          }
        });
        return next;
      });
    }
  }, []);

  const clearData = useCallback(() => {
    setStockDataMap({});
    setFetchStatus({});
    fetchedRef.current.clear();
  }, []);

  return { stockDataMap, fetchStatus, loadStocks, clearData };
}
