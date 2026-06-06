#!/usr/bin/env python3
"""
0050 每日滾動式分析工具 — Anima
Usage:
  python main.py              # 抓即時資料 (需本機網路)
  python main.py --demo       # 範例資料展示模式
  python main.py --stock 006208  # 其他 ETF
"""
import argparse

from analyzer import analyze_all
from reporter import print_report


def run_live(stock_no: str = '0050') -> None:
    from fetcher import (
        get_last_trading_date,
        fetch_price_data,
        fetch_price_history,
        fetch_institutional,
        fetch_taifex_institutional,
        fetch_margin_short,
        fetch_etf_nav,
        fetch_us_markets,
        fetch_exchange_rate,
        fetch_taiex,
        fetch_news,
    )
    from technicals import calc_technicals

    dt = get_last_trading_date()
    print(f'\n⏳ 抓取 {stock_no} 資料中（交易日：{dt.strftime("%Y/%m/%d")}）...')

    steps = [
        ('收盤價',       lambda: fetch_price_data(stock_no, dt)),
        ('歷史K線',     lambda: fetch_price_history(stock_no, months=4)),
        ('三大法人現貨', lambda: fetch_institutional(stock_no, dt)),
        ('外資台指期',   lambda: fetch_taifex_institutional()),
        ('融資融券',     lambda: fetch_margin_short(stock_no, dt)),
        ('ETF淨值',     lambda: fetch_etf_nav(stock_no)),
        ('美股夜盤',     lambda: fetch_us_markets()),
        ('美元匯率',     lambda: fetch_exchange_rate()),
        ('大盤指數',     lambda: fetch_taiex(dt)),
        ('近期新聞',     lambda: fetch_news(stock_no)),
    ]

    # Critical sources — if any of these fail, stop and report the error
    CRITICAL = {'收盤價', '歷史K線', '三大法人現貨', '美股夜盤', '大盤指數'}

    results = {}
    failed  = []
    for name, fn in steps:
        print(f'  ↳ {name}...', end=' ', flush=True)
        try:
            data = fn()
            # Check if critical fetch actually returned useful data
            if name in CRITICAL and not data:
                raise ValueError('空白回應')
            results[name] = data
            print('✓')
        except Exception as e:
            print(f'✗  → {e}')
            results[name] = {}
            if name in CRITICAL:
                failed.append(f'{name} ({e})')

    if failed:
        print()
        print('=' * 55)
        print('  ❌ 以下關鍵資料無法取得，無法產生可靠分析：')
        for f in failed:
            print(f'     • {f}')
        print()
        print('  請確認：')
        print('  1. 現在是交易日下午 15:00 以後')
        print('  2. 網路可正常連線至 finance.yahoo.com / twse.com.tw')
        print('  3. 已執行：py -m pip install -r requirements.txt')
        print('=' * 55)
        return

    price   = results['收盤價']
    history = results['歷史K線']
    inst    = results['三大法人現貨']
    futures = results['外資台指期']
    margin  = results['融資融券']
    etf_nav = results['ETF淨值']
    us      = results['美股夜盤']
    fx      = results['美元匯率']
    taiex   = results['大盤指數']
    news    = results['近期新聞']

    print('  ↳ 計算技術指標...', end=' ', flush=True)
    tech = calc_technicals(history) if history else {}
    print('✓')

    signal = analyze_all(price, inst, futures, margin, etf_nav, tech, us, taiex, fx)
    print_report(price, inst, futures, margin, etf_nav, tech, us, taiex, fx, news, signal)


def run_demo() -> None:
    import demo_data as d
    from technicals import calc_technicals
    print('\n📌 [DEMO 模式] 使用範例資料，展示報告格式')
    # Use pre-calculated tech from demo (skip history fetch in demo)
    signal = analyze_all(
        d.PRICE, d.INSTITUTIONAL, d.FUTURES, d.MARGIN,
        d.ETF_NAV, d.TECH, d.US_MARKETS, d.TAIEX, d.FX,
    )
    print_report(
        d.PRICE, d.INSTITUTIONAL, d.FUTURES, d.MARGIN,
        d.ETF_NAV, d.TECH, d.US_MARKETS, d.TAIEX, d.FX,
        d.NEWS, signal,
    )


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='0050 每日分析工具')
    parser.add_argument('--stock', default='0050', help='ETF/股票代號 (預設: 0050)')
    parser.add_argument('--demo',  action='store_true', help='使用範例資料展示')
    args = parser.parse_args()

    if args.demo:
        run_demo()
    else:
        run_live(args.stock)
