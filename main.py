#!/usr/bin/env python3
"""
0050 每日滾動式分析工具 — Anima
Usage:
  python main.py              # 抓即時資料 (需本機網路)
  python main.py --demo       # 範例資料展示模式
  python main.py --stock 006208  # 其他 ETF
"""
import argparse
from datetime import datetime

from analyzer import analyze
from reporter import print_report


def run_live(stock_no: str = '0050') -> None:
    from fetcher import (
        get_last_trading_date,
        fetch_price_data,
        fetch_institutional,
        fetch_margin_short,
        fetch_etf_nav,
        fetch_warrant_sentiment,
        fetch_news,
        fetch_taiex,
    )

    dt = get_last_trading_date()
    print(f'\n⏳ 抓取 {stock_no} 資料中（交易日：{dt.strftime("%Y/%m/%d")}）...')

    steps = [
        ('收盤價',   lambda: fetch_price_data(stock_no, dt)),
        ('三大法人', lambda: fetch_institutional(stock_no, dt)),
        ('融資融券', lambda: fetch_margin_short(stock_no, dt)),
        ('ETF淨值', lambda: fetch_etf_nav(stock_no)),
        ('權證籌碼', lambda: fetch_warrant_sentiment(stock_no, dt)),
        ('近期新聞', lambda: fetch_news(stock_no)),
        ('大盤指數', lambda: fetch_taiex(dt)),
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

    price, inst, margin, etf_nav, warrant, news, taiex = results
    signal = analyze(price, inst, margin, etf_nav, warrant, taiex)
    print_report(price, inst, margin, etf_nav, warrant, taiex, news, signal)


def run_demo() -> None:
    import demo_data as d
    print('\n📌 [DEMO 模式] 使用範例資料，展示報告格式')
    signal = analyze(d.PRICE, d.INSTITUTIONAL, d.MARGIN, d.ETF_NAV, d.WARRANT, d.TAIEX)
    print_report(d.PRICE, d.INSTITUTIONAL, d.MARGIN, d.ETF_NAV, d.WARRANT, d.TAIEX, d.NEWS, signal)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='0050 每日分析工具')
    parser.add_argument('--stock', default='0050', help='ETF/股票代號 (預設: 0050)')
    parser.add_argument('--demo', action='store_true', help='使用範例資料展示')
    args = parser.parse_args()

    if args.demo:
        run_demo()
    else:
        run_live(args.stock)
