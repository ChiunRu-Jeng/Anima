"""
Data fetching module for 0050 daily analysis.
Sources: TWSE, TAIFEX, stooq (US markets / FX), cnyes news.
"""
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


# ── Helpers ─────────────────────────────────────────────────────────────────

def get_last_trading_date() -> datetime:
    now = datetime.now()
    dt  = now if now.hour >= 14 else now - timedelta(days=1)
    while dt.weekday() >= 5:
        dt -= timedelta(days=1)
    return dt


def _parse_num(s: str) -> int:
    """Parse TWSE number strings that may use special minus sign U+2212 '−'."""
    cleaned = (s.replace(',', '')
                .replace('+', '')
                .replace('−', '-')   # special minus sign → regular minus
                .replace('--', '0')
                .replace('X', '0')
                .strip())
    if not cleaned or cleaned in ('-', ''):
        return 0
    try:
        return int(cleaned)
    except ValueError:
        return 0


def _parse_float(s: str) -> float | None:
    try:
        cleaned = s.replace(',', '').replace('+', '').replace('−', '-').strip()
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def _twse_get(url: str, params: dict) -> dict | None:
    try:
        r = SESSION.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        return data
    except Exception as e:
        print(f"  [WARN] TWSE fetch failed: {e}")
        return None


def _stooq_get(symbol: str, rows: int = 5) -> list[float] | None:
    """Fetch recent daily closing prices from stooq.com (no rate limiting)."""
    try:
        url = f'https://stooq.com/q/d/l/?s={symbol}&i=d'
        r = SESSION.get(url, timeout=15)
        r.raise_for_status()
        lines = [l for l in r.text.strip().split('\n') if l.strip()]
        if len(lines) < 2:
            return None
        closes = []
        for line in lines[1:]:          # skip CSV header
            parts = line.split(',')
            if len(parts) >= 5:
                v = _parse_float(parts[4])
                if v is not None:
                    closes.append(v)
        return closes[-rows:] if closes else None
    except Exception as e:
        print(f"  [WARN] stooq ({symbol}) failed: {e}")
        return None


# ── 1. 收盤價 ────────────────────────────────────────────────────────────────

def fetch_price_data(stock_no: str = '0050', date: datetime = None) -> dict:
    dt       = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data     = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {'date': dt.strftime('%Y/%m/%d')}
    if data and data.get('stat') == 'OK' and data.get('data'):
        last = data['data'][-1]
        try:
            result.update({
                'date':       last[0],
                'volume':     int(last[1].replace(',', '')) // 1000,  # 股 → 張
                'open':       _parse_float(last[3]),
                'high':       _parse_float(last[4]),
                'low':        _parse_float(last[5]),
                'close':      _parse_float(last[6]),
                'change':     _parse_float(last[7]) if last[7] not in ('--', 'X', ' ') else 0.0,
            })
            close = result.get('close') or 0
            change = result.get('change') or 0
            prev = close - change
            result['change_pct'] = round(change / prev * 100, 2) if prev else 0.0
        except Exception as e:
            print(f"  [WARN] Price parse error: {e}")
    return result


# ── 2. 價格歷史（技術指標用）─────────────────────────────────────────────────

def fetch_price_history(stock_no: str = '0050', months: int = 4) -> list[dict]:
    from dateutil.relativedelta import relativedelta
    dt       = get_last_trading_date()
    all_rows = []

    for i in range(months):
        target   = dt - relativedelta(months=i)
        date_str = target.strftime('%Y%m01')
        data     = _twse_get(
            'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
            {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
        )
        if data and data.get('stat') == 'OK' and data.get('data'):
            for row in data['data']:
                try:
                    all_rows.append({
                        'date':   row[0],
                        'volume': int(row[1].replace(',', '')) // 1000,
                        'open':   _parse_float(row[3]),
                        'high':   _parse_float(row[4]),
                        'low':    _parse_float(row[5]),
                        'close':  _parse_float(row[6]),
                    })
                except Exception:
                    pass

    all_rows.sort(key=lambda x: x['date'])
    return all_rows


# ── 3. 三大法人現貨 ───────────────────────────────────────────────────────────

def fetch_institutional(stock_no: str = '0050', date: datetime = None) -> dict:
    dt       = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data     = _twse_get(
        'https://www.twse.com.tw/rwd/zh/fund/T86',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {'foreign_net': None, 'site_net': None, 'dealer_net': None, 'total_net': None}

    if data and data.get('stat') == 'OK' and data.get('data'):
        foreign_fini      = None  # pure 外資 (FINI), excluding 陸資
        foreign_combined  = None  # 外資及陸資 fallback

        for row in data['data']:
            if not row:
                continue
            name = row[0]
            # T86 reports in shares (股); ÷1000 → 張
            net = _parse_num(row[3]) // 1000

            if '外資' in name and '自營' not in name and '合計' not in name:
                if '陸資' not in name:
                    foreign_fini = net          # pure FINI preferred
                else:
                    foreign_combined = net      # combined fallback
            elif '投信' in name and '合計' not in name:
                result['site_net'] = net
            elif '自營商' in name and '小計' not in name and '避險' not in name and '合計' not in name:
                result['dealer_net'] = net

        # Use pure FINI if available; otherwise fall back to combined figure
        result['foreign_net'] = foreign_fini if foreign_fini is not None else foreign_combined

        nets = [v for v in [result['foreign_net'], result['site_net'], result['dealer_net']] if v is not None]
        result['total_net'] = sum(nets) if nets else None

    return result


# ── 4. 外資台指期多空未平倉 ───────────────────────────────────────────────────

def fetch_taifex_institutional() -> dict:
    """
    Fetch 外資台指期淨多空未平倉口數 from TAIFEX.
    The table structure: 身份別 | 多方口數 | 多方金額 | 空方口數 | 空方金額 | 淨額口數 | 淨額金額
    We want 淨額口數 for 外資及陸資 under 臺股期貨.
    """
    result = {'futures_foreign_net': None}
    try:
        url  = 'https://www.taifex.com.tw/cht/3/futContractsDate'
        r    = SESSION.get(url, timeout=15)
        soup = BeautifulSoup(r.text, 'lxml')

        in_taiex = False
        for row in soup.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            texts = [c.get_text(strip=True) for c in cells]

            # Detect section header for 臺股期貨
            row_text = ' '.join(texts)
            if '臺股期貨' in row_text and '電子' not in row_text and '金融' not in row_text:
                in_taiex = True

            # Leave 臺股期貨 section when we hit another product
            if in_taiex and any(k in row_text for k in ['電子期貨', '金融期貨', '小型臺指']):
                in_taiex = False

            if not in_taiex:
                continue

            # Find 外資及陸資 row
            if '外資' not in row_text:
                continue

            # Extract numeric values from this row
            nums = []
            for text in texts:
                clean = (text.replace(',', '')
                             .replace('+', '')
                             .replace('−', '-')
                             .replace('--', ''))
                try:
                    nums.append(int(clean))
                except ValueError:
                    pass

            # Expected pattern: [多方口數, 多方金額, 空方口數, 空方金額, 淨額口數, 淨額金額]
            # We want index 4 (淨額口數), or calculate long - short
            if len(nums) >= 5:
                net = nums[4]   # 淨額口數
                if abs(net) <= 150_000:  # sanity check: impossible to exceed 150k lots
                    result['futures_foreign_net'] = net
                    break
            elif len(nums) >= 3:
                # Fallback: long - short
                net = nums[0] - nums[2]
                if abs(net) <= 150_000:
                    result['futures_foreign_net'] = net
                    break

    except Exception as e:
        print(f"  [WARN] TAIFEX fetch failed: {e}")

    return result


# ── 5. 融資融券 ───────────────────────────────────────────────────────────────

def fetch_margin_short(stock_no: str = '0050', date: datetime = None) -> dict:
    dt       = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    data     = _twse_get(
        'https://www.twse.com.tw/rwd/zh/marginShortselling/MI_MARGN',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'},
    )
    result = {
        'margin_buy': None, 'margin_sell': None,
        'margin_balance': None, 'margin_limit': None,
        'short_sell': None, 'short_buy': None,
        'short_balance': None, 'offset': None,
    }
    if data and data.get('stat') == 'OK' and data.get('data'):
        rows = data['data']
        if rows:
            row = rows[-1]
            try:
                result.update({
                    'margin_buy':     _parse_num(row[2]),
                    'margin_sell':    _parse_num(row[3]),
                    'margin_balance': _parse_num(row[4]),
                    'margin_limit':   _parse_num(row[5]),
                    'short_sell':     _parse_num(row[8]),
                    'short_buy':      _parse_num(row[9]),
                    'short_balance':  _parse_num(row[10]),
                    'offset':         _parse_num(row[12]),
                })
            except Exception as e:
                print(f"  [WARN] Margin parse error: {e}")
    return result


# ── 6. ETF 淨值 / 折溢價 ──────────────────────────────────────────────────────

def fetch_etf_nav(stock_no: str = '0050') -> dict:
    result = {'nav': None, 'close': None, 'premium_pct': None}
    try:
        url  = f'https://www.twse.com.tw/rwd/zh/ETF/etfDiv?response=json&stockNo={stock_no}'
        r    = SESSION.get(url, timeout=15)
        data = r.json()
        if data and data.get('data'):
            row = data['data'][0]
            # Column layout varies; scan all cells for two plausible price values
            floats = []
            for cell in row:
                v = _parse_float(str(cell))
                # Filter: must look like a price (10 ~ 10000 range for 0050)
                if v is not None and 10 < v < 10_000:
                    floats.append(v)

            if len(floats) >= 2:
                # The two price-like numbers are close (NAV vs close price)
                # NAV is usually the smaller one for 0050
                floats_sorted = sorted(set(floats))
                nav   = floats_sorted[0]
                close = floats_sorted[-1]
                # If they're too far apart, skip — likely wrong columns
                if abs(close - nav) / nav < 0.05:
                    result['nav']         = nav
                    result['close']       = close
                    result['premium_pct'] = round((close - nav) / nav * 100, 3)
    except Exception as e:
        print(f"  [WARN] ETF NAV failed: {e}")
    return result


# ── 7. 美股夜盤（stooq — 無 rate-limit）─────────────────────────────────────

def fetch_us_markets() -> dict:
    result = {
        'sp500_chg':  None, 'sp500_close':  None,
        'nasdaq_chg': None, 'nasdaq_close': None,
        'sox_chg':    None, 'sox_close':    None,
    }
    # stooq symbols: ^SPX = S&P500, ^NDQ = NASDAQ-100, ^SOX = Philadelphia Semi
    symbols = {'sp500': '^spx', 'nasdaq': '^ndq', 'sox': '^sox'}
    for key, sym in symbols.items():
        closes = _stooq_get(sym, rows=5)
        if closes and len(closes) >= 2:
            chg = (closes[-1] - closes[-2]) / closes[-2] * 100
            result[f'{key}_chg']   = round(chg, 2)
            result[f'{key}_close'] = round(closes[-1], 2)
    return result


# ── 8. 匯率 USD/TWD（stooq）──────────────────────────────────────────────────

def fetch_exchange_rate() -> dict:
    result = {'usdtwd': None, 'usdtwd_chg': None}
    closes = _stooq_get('usdtwd', rows=5)
    if closes and len(closes) >= 2:
        result['usdtwd']     = round(closes[-1], 3)
        result['usdtwd_chg'] = round(closes[-1] - closes[-2], 3)
    return result


# ── 9. 大盤加權指數 ───────────────────────────────────────────────────────────

def fetch_taiex(date: datetime = None) -> dict:
    dt       = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    result   = {'close': None, 'change': None, 'change_pct': None}
    data     = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX',
        {'date': date_str, 'response': 'json'},
    )
    if not data or data.get('stat') != 'OK':
        return result

    # MI_INDEX may use 'tables' list or top-level 'data' — handle both
    rows_to_search: list = []
    for table in data.get('tables', []):
        rows_to_search.extend(table.get('data', []))
    rows_to_search.extend(data.get('data', []))

    for row in rows_to_search:
        if not row:
            continue
        name = str(row[0])
        if '加權' not in name and '發行量' not in name:
            continue
        try:
            close  = _parse_float(row[1])
            change = _parse_float(row[2])
            if close and change is not None:
                result['close']  = close
                result['change'] = change
                prev = close - change
                result['change_pct'] = round(change / prev * 100, 2) if prev else 0.0
                break
        except Exception:
            pass

    # Fallback: use stooq ^twi (Taiwan Weighted Index)
    if result['close'] is None:
        closes = _stooq_get('^twi', rows=5)
        if closes and len(closes) >= 2:
            result['close']      = round(closes[-1], 2)
            result['change']     = round(closes[-1] - closes[-2], 2)
            prev = closes[-2]
            result['change_pct'] = round((closes[-1] - closes[-2]) / prev * 100, 2) if prev else 0.0

    return result


# ── 10. 近期新聞 ──────────────────────────────────────────────────────────────

def fetch_news(keyword: str = '0050', limit: int = 6) -> list[dict]:
    news = []
    try:
        url  = f'https://api.cnyes.com/media/api/v1/newslist/keyword/{keyword}'
        r    = SESSION.get(url, params={'page': 1, 'limit': limit}, timeout=15)
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
