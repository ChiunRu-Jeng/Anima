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

    results = []
    for name, fn in steps:
        print(f'  ↳ {name}...', end=' ', flush=True)
        try:
            results.append(fn())
            print('✓')
        except Exception as e:
            print(f'✗ ({e})')
            results.append({})

    price, history, inst, futures, margin, etf_nav, us, fx, taiex, news = results

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
