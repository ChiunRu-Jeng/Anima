"""
Data fetching module for 0050 daily analysis.
Primary sources: TWSE public API, TAIFEX, Yahoo Finance, cnyes news.
"""
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def get_last_trading_date() -> datetime:
    """Return the most recent trading day (skip weekends; if before 14:30 use yesterday)."""
    now = datetime.now()
    dt  = now if now.hour >= 14 else now - timedelta(days=1)
    while dt.weekday() >= 5:
        dt -= timedelta(days=1)
    return dt


def _twse_get(url: str, params: dict) -> dict | None:
    try:
        r = SESSION.get(url, params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  [WARN] TWSE fetch failed: {e}")
        return None


def _yf_get(symbol: str, interval: str = '1d', range_: str = '10d') -> list[float] | None:
    """Fetch closing prices from Yahoo Finance."""
    try:
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}'
        r = SESSION.get(url, params={'interval': interval, 'range': range_}, timeout=15)
        r.raise_for_status()
        data = r.json()
        closes = data['chart']['result'][0]['indicators']['quote'][0]['close']
        return [c for c in closes if c is not None]
    except Exception as e:
        print(f"  [WARN] Yahoo Finance ({symbol}) failed: {e}")
        return None


# ── 1. 收盤價 ───────────────────────────────────────────────────────────────

def fetch_price_data(stock_no: str = '0050', date: datetime = None) -> dict:
    """Fetch daily OHLCV from TWSE for the most recent date in the given month."""
    dt      = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data    = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {'date': dt.strftime('%Y/%m/%d')}
    if data and data.get('stat') == 'OK' and data.get('data'):
        last = data['data'][-1]
        try:
            def c(s): return float(s.replace(',', '').replace('--', '0').replace('X', '0'))
            result.update({
                'date':   last[0],
                'volume': int(last[1].replace(',', '')),
                'open':   c(last[3]), 'high': c(last[4]),
                'low':    c(last[5]), 'close': c(last[6]),
                'change': c(last[7]) if last[7] not in ('--', 'X', ' ') else 0.0,
            })
            prev = result['close'] - result['change']
            result['change_pct'] = round(result['change'] / prev * 100, 2) if prev else 0.0
        except Exception as e:
            print(f"  [WARN] Price parse error: {e}")
    return result


# ── 2. 價格歷史（技術指標用）────────────────────────────────────────────────

def fetch_price_history(stock_no: str = '0050', months: int = 4) -> list[dict]:
    """
    Fetch N months of daily OHLCV for technical indicator calculation.
    Returns list sorted oldest-first.
    """
    from dateutil.relativedelta import relativedelta
    dt      = get_last_trading_date()
    all_rows = []

    for i in range(months):
        target    = dt - relativedelta(months=i)
        date_str  = target.strftime('%Y%m01')
        data = _twse_get(
            'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
            {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
        )
        if data and data.get('stat') == 'OK' and data.get('data'):
            for row in data['data']:
                try:
                    def c(s): return float(s.replace(',', '').replace('--', '0'))
                    all_rows.append({
                        'date':   row[0],
                        'volume': int(row[1].replace(',', '')),
                        'open':   c(row[3]), 'high': c(row[4]),
                        'low':    c(row[5]), 'close': c(row[6]),
                    })
                except Exception:
                    pass

    all_rows.sort(key=lambda x: x['date'])
    return all_rows


# ── 3. 三大法人現貨 ──────────────────────────────────────────────────────────

def fetch_institutional(stock_no: str = '0050', date: datetime = None) -> dict:
    """Fetch 三大法人現貨買賣超 (foreign/FINI, investment trust/SITE, dealers)."""
    dt      = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data    = _twse_get(
        'https://www.twse.com.tw/rwd/zh/fund/T86',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {'foreign_net': None, 'site_net': None, 'dealer_net': None, 'total_net': None}
    if data and data.get('stat') == 'OK' and data.get('data'):
        for row in data['data']:
            name = row[0] if row else ''
            try:
                net = int(row[3].replace(',', '').replace('+', '').replace('--', '0'))
            except Exception:
                net = 0
            if '外資' in name and '陸資' not in name and '合計' not in name:
                result['foreign_net'] = net
            elif '投信' in name:
                result['site_net'] = net
            elif '自營商' in name and '小計' not in name and '避險' not in name and '合計' not in name:
                result['dealer_net'] = net
        nets = [v for v in [result['foreign_net'], result['site_net'], result['dealer_net']] if v is not None]
        result['total_net'] = sum(nets) if nets else None
    return result


# ── 4. 外資台指期多空未平倉 ──────────────────────────────────────────────────

def fetch_taifex_institutional() -> dict:
    """
    Fetch 外資台指期淨多空未平倉口數 from TAIFEX.
    Positive = net long (多單), Negative = net short (空單).
    """
    result = {'futures_foreign_net': None}
    try:
        url = 'https://www.taifex.com.tw/cht/3/futContractsDate'
        r   = SESSION.get(url, timeout=15)
        soup = BeautifulSoup(r.text, 'lxml')
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                texts = [c.get_text(strip=True) for c in cells]
                # Look for 外資 row in 臺股期貨 section
                if len(texts) >= 10 and '外資' in texts[0] and '臺股' not in texts[0]:
                    try:
                        # net = long_oi - short_oi (columns vary by page layout)
                        long_oi  = int(texts[3].replace(',', '').replace('--', '0'))
                        short_oi = int(texts[6].replace(',', '').replace('--', '0'))
                        result['futures_foreign_net'] = long_oi - short_oi
                        break
                    except Exception:
                        pass
            if result['futures_foreign_net'] is not None:
                break
    except Exception as e:
        print(f"  [WARN] TAIFEX fetch failed: {e}")
    return result


# ── 5. 融資融券 ──────────────────────────────────────────────────────────────

def fetch_margin_short(stock_no: str = '0050', date: datetime = None) -> dict:
    """Fetch margin buying (融資) and short selling (融券) balances."""
    dt      = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data    = _twse_get(
        'https://www.twse.com.tw/rwd/zh/marginShortselling/MI_MARGN',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {
        'margin_buy': None, 'margin_sell': None, 'margin_balance': None, 'margin_limit': None,
        'short_sell': None, 'short_buy':  None, 'short_balance':  None, 'offset': None,
    }
    if data and data.get('stat') == 'OK' and data.get('data'):
        rows = data['data']
        if rows:
            row = rows[-1]
            try:
                def ci(s): return int(s.replace(',', ''))
                result.update({
                    'margin_buy':     ci(row[2]),
                    'margin_sell':    ci(row[3]),
                    'margin_balance': ci(row[4]),
                    'margin_limit':   ci(row[5]),
                    'short_sell':     ci(row[8]),
                    'short_buy':      ci(row[9]),
                    'short_balance':  ci(row[10]),
                    'offset':         ci(row[12]),
                })
            except Exception as e:
                print(f"  [WARN] Margin parse error: {e}")
    return result


# ── 6. ETF 淨值 / 折溢價 ─────────────────────────────────────────────────────

def fetch_etf_nav(stock_no: str = '0050') -> dict:
    """Fetch ETF NAV and premium/discount."""
    result = {'nav': None, 'close': None, 'premium_pct': None}
    try:
        url = f'https://www.twse.com.tw/rwd/zh/ETF/etfDiv?response=json&stockNo={stock_no}'
        r   = SESSION.get(url, timeout=15)
        data = r.json()
        if data and data.get('data'):
            row   = data['data'][0]
            nav   = float(row[2].replace(',', ''))
            close = float(row[1].replace(',', ''))
            result['nav']         = nav
            result['close']       = close
            result['premium_pct'] = round((close - nav) / nav * 100, 3) if nav else None
    except Exception as e:
        print(f"  [WARN] ETF NAV failed: {e}")
    return result


# ── 7. 美股夜盤（S&P500 / NASDAQ / 費半）────────────────────────────────────

def fetch_us_markets() -> dict:
    """
    Fetch overnight US market performance.
    Returns change_pct for S&P500, NASDAQ, and Philadelphia Semiconductor Index.
    """
    result = {
        'sp500_chg': None, 'sp500_close': None,
        'nasdaq_chg': None, 'nasdaq_close': None,
        'sox_chg': None,   'sox_close': None,
    }
    symbols = {'sp500': '^GSPC', 'nasdaq': '^IXIC', 'sox': '^SOX'}
    for key, sym in symbols.items():
        closes = _yf_get(sym, interval='1d', range_='10d')
        if closes and len(closes) >= 2:
            chg = (closes[-1] - closes[-2]) / closes[-2] * 100
            result[f'{key}_chg']   = round(chg, 2)
            result[f'{key}_close'] = round(closes[-1], 2)
    return result


# ── 8. 匯率（USD/TWD）───────────────────────────────────────────────────────

def fetch_exchange_rate() -> dict:
    """Fetch USD/TWD spot rate and daily change."""
    result = {'usdtwd': None, 'usdtwd_chg': None}
    closes = _yf_get('USDTWD=X', interval='1d', range_='10d')
    if closes and len(closes) >= 2:
        result['usdtwd']     = round(closes[-1], 3)
        result['usdtwd_chg'] = round(closes[-1] - closes[-2], 3)
    return result


# ── 9. 大盤指數 ──────────────────────────────────────────────────────────────

def fetch_taiex(date: datetime = None) -> dict:
    """Fetch TAIEX (加權指數) latest data."""
    dt      = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    result  = {'close': None, 'change': None, 'change_pct': None}
    data    = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX',
        {'date': date_str, 'response': 'json'},
    )
    if data and data.get('stat') == 'OK':
        for table in data.get('tables', []):
            for row in table.get('data', []):
                if row and '發行量加權股價指數' in str(row[0]):
                    try:
                        result['close']  = float(row[1].replace(',', ''))
                        result['change'] = float(row[2].replace(',', '').replace('+', ''))
                        prev = result['close'] - result['change']
                        result['change_pct'] = round(result['change'] / prev * 100, 2) if prev else 0.0
                    except Exception:
                        pass
                    break
    return result


# ── 10. 近期新聞 ─────────────────────────────────────────────────────────────

def fetch_news(keyword: str = '0050', limit: int = 6) -> list[dict]:
    """Fetch recent news from cnyes (鉅亨網)."""
    news = []
    try:
        url = f'https://api.cnyes.com/media/api/v1/newslist/keyword/{keyword}'
        r   = SESSION.get(url, params={'page': 1, 'limit': limit}, timeout=15)
        data = r.json()
        for item in data.get('data', {}).get('items', [])[:limit]:
            news.append({
                'title': item.get('title', ''),
                'time':  item.get('publishAt', ''),
                'url':   f"https://news.cnyes.com/news/id/{item.get('newsId', '')}",
            })
    except Exception as e:
        print(f"  [WARN] News fetch failed: {e}")
    return news
