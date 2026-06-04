import { useState, useEffect, useMemo, useCallback } from 'react';
import { Interval, Industry } from './types';
import { STOCKS, INDUSTRIES, STOCK_COLORS } from './data/stocks';
import { useStockData } from './hooks/useStockData';
import { mergeStockData } from './utils/chart';
import Sidebar from './components/Sidebar';
import ChartArea from './components/ChartArea';
import Header from './components/Header';

const DEFAULT_SELECTED = ['^TWII', '2330', '0050'];

export default function App() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(DEFAULT_SELECTED);
  const [interval, setInterval] = useState<Interval>('1d');
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([...INDUSTRIES] as Industry[]);
  const [normalise, setNormalise] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { stockDataMap, fetchStatus, loadStocks } = useStockData();

  // Load data whenever selected symbols or interval changes
  useEffect(() => {
    if (selectedSymbols.length > 0) {
      loadStocks(selectedSymbols, interval);
    }
  }, [selectedSymbols, interval, loadStocks]);

  const chartData = useMemo(
    () => mergeStockData(stockDataMap, selectedSymbols, normalise),
    [stockDataMap, selectedSymbols, normalise]
  );

  const toggleSymbol = useCallback((symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  }, []);

  const toggleIndustry = useCallback((industry: Industry) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  }, []);

  const filteredStocks = useMemo(
    () => STOCKS.filter(s => selectedIndustries.includes(s.industry as Industry)),
    [selectedIndustries]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      <Header
        interval={interval}
        onIntervalChange={setInterval}
        normalise={normalise}
        onNormaliseChange={setNormalise}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            stocks={filteredStocks}
            allStocks={STOCKS}
            selectedSymbols={selectedSymbols}
            selectedIndustries={selectedIndustries}
            fetchStatus={fetchStatus}
            colors={STOCK_COLORS}
            onToggleSymbol={toggleSymbol}
            onToggleIndustry={toggleIndustry}
          />
        )}
        <ChartArea
          chartData={chartData}
          selectedSymbols={selectedSymbols}
          stockDataMap={stockDataMap}
          fetchStatus={fetchStatus}
          colors={STOCK_COLORS}
          normalise={normalise}
          interval={interval}
        />
      </div>
    </div>
  );
}
