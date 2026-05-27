"""
Data fetching module for 0050 daily analysis.
Sources: TWSE public API, cnyes news API.
"""
import requests
import json
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-TW,zh;q=0.9',
    'Referer': 'https://www.twse.com.tw',
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def get_last_trading_date() -> datetime:
    """Return the most recent trading day (skip weekends; if before 14:30 use yesterday)."""
    now = datetime.now()
    dt = now if now.hour >= 14 else now - timedelta(days=1)
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


# ── 1. 收盤價 / 成交量 ──────────────────────────────────────────────────────

def fetch_price_data(stock_no: str = '0050', date: datetime = None) -> dict:
    """
    Fetch daily price (OHLCV) from TWSE.
    Returns dict with keys: date, open, high, low, close, volume, change, change_pct
    """
    dt = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')

    data = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'}
    )

    result = {'date': dt.strftime('%Y/%m/%d')}

    if data and data.get('stat') == 'OK' and data.get('data'):
        rows = data['data']
        last = rows[-1]  # most recent row in the month
        try:
            def clean(s):
                return float(s.replace(',', '').replace('--', '0').replace('X', '0'))
            result.update({
                'date': last[0],
                'volume': int(last[1].replace(',', '')),
                'open':   clean(last[3]),
                'high':   clean(last[4]),
                'low':    clean(last[5]),
                'close':  clean(last[6]),
                'change': clean(last[7]) if last[7] not in ('--', 'X') else 0.0,
            })
            if result.get('close') and result['close'] != 0:
                prev = result['close'] - result['change']
                result['change_pct'] = round(result['change'] / prev * 100, 2) if prev else 0.0
        except Exception as e:
            print(f"  [WARN] Price parse error: {e}")

    return result


# ── 2. 三大法人 ────────────────────────────────────────────────────────────

def fetch_institutional(stock_no: str = '0050', date: datetime = None) -> dict:
    """
    Fetch 三大法人買賣超 (foreign/FINI, investment trust/SITE, dealers).
    Returns dict: foreign_net, site_net, dealer_net, total_net (unit: shares)
    """
    dt = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')

    data = _twse_get(
        'https://www.twse.com.tw/rwd/zh/fund/T86',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'}
    )

    result = {'foreign_net': None, 'site_net': None, 'dealer_net': None, 'total_net': None}

    if data and data.get('stat') == 'OK' and data.get('data'):
        rows = data['data']
        for row in rows:
            name = row[0] if row else ''
            try:
                net = int(row[3].replace(',', '').replace('+', '').replace('--', '0'))
            except Exception:
                net = 0
            if '外資' in name and '陸資' not in name:
                result['foreign_net'] = net
            elif '投信' in name:
                result['site_net'] = net
            elif '自營商' in name and '小計' not in name and '避險' not in name and '合計' not in name:
                result['dealer_net'] = net

        # total from last row or sum
        nets = [v for v in [result['foreign_net'], result['site_net'], result['dealer_net']] if v is not None]
        result['total_net'] = sum(nets) if nets else None

    return result


# ── 3. 融資融券 ────────────────────────────────────────────────────────────

def fetch_margin_short(stock_no: str = '0050', date: datetime = None) -> dict:
    """
    Fetch margin buying (融資) and short selling (融券) balances.
    """
    dt = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')

    data = _twse_get(
        'https://www.twse.com.tw/rwd/zh/marginShortselling/MI_MARGN',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'}
    )

    result = {
        'margin_buy': None, 'margin_sell': None, 'margin_balance': None, 'margin_limit': None,
        'short_sell': None, 'short_buy': None, 'short_balance': None,
        'offset': None,
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


# ── 4. ETF 淨值 / 折溢價 ───────────────────────────────────────────────────

def fetch_etf_nav(stock_no: str = '0050') -> dict:
    """
    Fetch ETF NAV and premium/discount from TWSE ETF page.
    """
    result = {'nav': None, 'close': None, 'premium_pct': None}
    try:
        url = f'https://www.twse.com.tw/rwd/zh/ETF/etfDiv?response=json&stockNo={stock_no}'
        r = SESSION.get(url, timeout=15)
        data = r.json()
        if data and data.get('data'):
            row = data['data'][0]
            nav = float(row[2].replace(',', ''))
            close = float(row[1].replace(',', ''))
            result['nav'] = nav
            result['close'] = close
            result['premium_pct'] = round((close - nav) / nav * 100, 3) if nav else None
    except Exception:
        # Fallback: try TWSE ETF page scrape
        try:
            url = f'https://www.twse.com.tw/zh/ETF/fund/{stock_no}'
            r = SESSION.get(url, timeout=15)
            soup = BeautifulSoup(r.text, 'lxml')
            tables = soup.find_all('table')
            for t in tables:
                rows = t.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    text = ' '.join(c.get_text(strip=True) for c in cells)
                    if '淨值' in text and len(cells) >= 2:
                        try:
                            result['nav'] = float(cells[1].get_text(strip=True).replace(',', ''))
                        except Exception:
                            pass
        except Exception:
            pass
    return result


# ── 5. 權證情緒 ────────────────────────────────────────────────────────────

def fetch_warrant_sentiment(stock_no: str = '0050', date: datetime = None) -> dict:
    """
    Fetch call/put warrant outstanding balance ratio from TWSE.
    """
    dt = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')

    result = {'call_balance': None, 'put_balance': None, 'cp_ratio': None}
    data = _twse_get(
        'https://www.twse.com.tw/rwd/zh/warrant/TWTAUU',
        {'date': date_str, 'stockNo': stock_no, 'response': 'json'}
    )

    if data and data.get('stat') == 'OK' and data.get('data'):
        call_total = 0
        put_total = 0
        for row in data['data']:
            try:
                # row[3]: type (認購 / 認售), row[9]: outstanding balance
                w_type = row[3]
                balance = int(row[9].replace(',', ''))
                if '認購' in w_type:
                    call_total += balance
                elif '認售' in w_type:
                    put_total += balance
            except Exception:
                pass
        result['call_balance'] = call_total
        result['put_balance'] = put_total
        total = call_total + put_total
        if total > 0:
            result['cp_ratio'] = round(call_total / total * 100, 1)

    return result


# ── 6. 近期新聞 ────────────────────────────────────────────────────────────

def fetch_news(keyword: str = '0050', limit: int = 8) -> list[dict]:
    """
    Fetch recent news from cnyes (鉅亨網) API.
    """
    news = []
    try:
        url = f'https://api.cnyes.com/media/api/v1/newslist/keyword/{keyword}'
        r = SESSION.get(url, params={'page': 1, 'limit': limit}, timeout=15)
        data = r.json()
        items = data.get('data', {}).get('items', [])
        for item in items[:limit]:
            news.append({
                'title': item.get('title', ''),
                'time':  item.get('publishAt', ''),
                'url':   f"https://news.cnyes.com/news/id/{item.get('newsId', '')}",
            })
    except Exception as e:
        print(f"  [WARN] News fetch failed: {e}")

    # Fallback: try goodinfo / yahoo finance TW news if cnyes fails
    if not news:
        try:
            url = f'https://tw.stock.yahoo.com/quote/{keyword}/news'
            r = SESSION.get(url, timeout=15)
            soup = BeautifulSoup(r.text, 'lxml')
            items = soup.select('li[class*="js-stream-content"]')[:limit]
            for item in items:
                a = item.find('a', href=True)
                if a:
                    news.append({
                        'title': a.get_text(strip=True),
                        'time':  '',
                        'url':   a['href'] if a['href'].startswith('http') else f'https://tw.stock.yahoo.com{a["href"]}',
                    })
        except Exception:
            pass

    return news


# ── 7. 大盤指數 (加權) ──────────────────────────────────────────────────────

def fetch_taiex(date: datetime = None) -> dict:
    """Fetch TAIEX (加權指數) latest data."""
    dt = date or get_last_trading_date()
    date_str = dt.strftime('%Y%m%d')
    result = {'close': None, 'change': None, 'change_pct': None}

    data = _twse_get(
        'https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX',
        {'date': date_str, 'response': 'json'}
    )
    if data and data.get('stat') == 'OK':
        # tables9 contains index info
        tables = data.get('tables', [])
        for table in tables:
            for row in table.get('data', []):
                if row and '發行量加權股價指數' in str(row[0]):
                    try:
                        result['close'] = float(row[1].replace(',', ''))
                        result['change'] = float(row[2].replace(',', '').replace('+', ''))
                        if result['close'] and result['change'] is not None:
                            prev = result['close'] - result['change']
                            result['change_pct'] = round(result['change'] / prev * 100, 2) if prev else 0.0
                    except Exception:
                        pass
                    break

    return result
