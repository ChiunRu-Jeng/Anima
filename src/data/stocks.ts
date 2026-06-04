import { Stock } from '../types';

export const STOCKS: Stock[] = [
  // 加權指數
  { symbol: '^TWII', name: '加權指數', industry: '加權指數', yahooSymbol: '%5ETWII' },

  // 科技股
  { symbol: '2330', name: '台積電', industry: '科技股', yahooSymbol: '2330.TW' },
  { symbol: '2317', name: '鴻海', industry: '科技股', yahooSymbol: '2317.TW' },
  { symbol: '2454', name: '聯發科', industry: '科技股', yahooSymbol: '2454.TW' },
  { symbol: '2308', name: '台達電', industry: '科技股', yahooSymbol: '2308.TW' },
  { symbol: '3008', name: '大立光', industry: '科技股', yahooSymbol: '3008.TW' },
  { symbol: '2382', name: '廣達', industry: '科技股', yahooSymbol: '2382.TW' },
  { symbol: '2395', name: '研華', industry: '科技股', yahooSymbol: '2395.TW' },
  { symbol: '2357', name: '華碩', industry: '科技股', yahooSymbol: '2357.TW' },

  // 金融股
  { symbol: '2881', name: '富邦金', industry: '金融股', yahooSymbol: '2881.TW' },
  { symbol: '2882', name: '國泰金', industry: '金融股', yahooSymbol: '2882.TW' },
  { symbol: '2884', name: '玉山金', industry: '金融股', yahooSymbol: '2884.TW' },
  { symbol: '2891', name: '中信金', industry: '金融股', yahooSymbol: '2891.TW' },
  { symbol: '2886', name: '兆豐金', industry: '金融股', yahooSymbol: '2886.TW' },

  // 傳產股
  { symbol: '1301', name: '台塑', industry: '傳產股', yahooSymbol: '1301.TW' },
  { symbol: '1303', name: '南亞', industry: '傳產股', yahooSymbol: '1303.TW' },
  { symbol: '2002', name: '中鋼', industry: '傳產股', yahooSymbol: '2002.TW' },
  { symbol: '1216', name: '統一', industry: '傳產股', yahooSymbol: '1216.TW' },

  // 生技股
  { symbol: '1786', name: '科妍', industry: '生技股', yahooSymbol: '1786.TW' },
  { symbol: '4726', name: '永日', industry: '生技股', yahooSymbol: '4726.TW' },

  // ETF
  { symbol: '0050', name: '元大台灣50', industry: 'ETF', yahooSymbol: '0050.TW' },
  { symbol: '0056', name: '元大高股息', industry: 'ETF', yahooSymbol: '0056.TW' },
  { symbol: '006208', name: '富邦台50', industry: 'ETF', yahooSymbol: '006208.TW' },
];

export const INDUSTRIES: string[] = ['加權指數', '科技股', '金融股', '傳產股', '生技股', 'ETF'];

export const STOCK_COLORS: Record<string, string> = {
  '^TWII':  '#F59E0B',
  '2330':   '#3B82F6',
  '2317':   '#10B981',
  '2454':   '#8B5CF6',
  '2308':   '#EC4899',
  '3008':   '#06B6D4',
  '2382':   '#F97316',
  '2395':   '#84CC16',
  '2357':   '#EF4444',
  '2881':   '#14B8A6',
  '2882':   '#6366F1',
  '2884':   '#F43F5E',
  '2891':   '#A78BFA',
  '2886':   '#34D399',
  '1301':   '#FCD34D',
  '1303':   '#FB923C',
  '2002':   '#60A5FA',
  '1216':   '#C084FC',
  '1786':   '#4ADE80',
  '4726':   '#F472B6',
  '0050':   '#38BDF8',
  '0056':   '#A3E635',
  '006208': '#FDE68A',
};
