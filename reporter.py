"""
Report formatting module — outputs a clean terminal report.
"""
from datetime import datetime
from analyzer import SignalResult


_BAR_WIDTH = 20


def _bar(score: float, max_score: float) -> str:
    filled = int(score / max_score * _BAR_WIDTH)
    return '█' * filled + '░' * (_BAR_WIDTH - filled)


def _fmt_int(v) -> str:
    if v is None:
        return 'N/A'
    try:
        return f'{int(v):,}'
    except Exception:
        return str(v)


def _fmt_float(v, dec=2) -> str:
    if v is None:
        return 'N/A'
    return f'{float(v):.{dec}f}'


def print_report(
    price: dict,
    inst: dict,
    margin: dict,
    etf_nav: dict,
    warrant: dict,
    taiex: dict,
    news: list[dict],
    result: SignalResult,
) -> None:
    w = 60
    sep = '═' * w
    thin = '─' * w

    print()
    print(sep)
    print(f'  📊  0050 每日分析報告  —  {price.get("date", datetime.now().strftime("%Y/%m/%d"))}')
    print(sep)

    # ── 收盤價 ──────────────────────────────────────────────
    print()
    print('【一、價格資訊】')
    print(thin)
    chg     = price.get('change', 0) or 0
    chg_pct = price.get('change_pct', 0) or 0
    arrow   = '▲' if chg >= 0 else '▼'
    print(f'  收盤價  : {_fmt_float(price.get("close"))}  {arrow} {abs(chg):.2f} ({chg_pct:+.2f}%)')
    print(f'  開/高/低: {_fmt_float(price.get("open"))} / {_fmt_float(price.get("high"))} / {_fmt_float(price.get("low"))}')
    print(f'  成交張數: {_fmt_int(price.get("volume"))} 張')
    taiex_close = taiex.get('close')
    taiex_chg   = taiex.get('change_pct')
    if taiex_close:
        print(f'  加權指數: {taiex_close:,.0f}  ({taiex_chg:+.2f}%)' if taiex_chg else f'  加權指數: {taiex_close:,.0f}')

    # ── 淨值 ────────────────────────────────────────────────
    print()
    print('【二、淨值 / 折溢價】')
    print(thin)
    nav = etf_nav.get('nav')
    pct = etf_nav.get('premium_pct')
    if nav:
        label = '溢價' if (pct or 0) >= 0 else '折價'
        print(f'  淨值 (NAV) : {_fmt_float(nav)}')
        print(f'  收盤 vs NAV: {label} {abs(pct or 0):.3f}%')
    else:
        print('  淨值資料: 無法取得')

    # ── 三大法人 ────────────────────────────────────────────
    print()
    print('【三、三大法人買賣超（張）】')
    print(thin)

    def fmt_net(v):
        if v is None:
            return 'N/A'
        return f'{v:+,}'

    print(f'  外資  : {fmt_net(inst.get("foreign_net"))}')
    print(f'  投信  : {fmt_net(inst.get("site_net"))}')
    print(f'  自營商: {fmt_net(inst.get("dealer_net"))}')
    print(f'  合計  : {fmt_net(inst.get("total_net"))}')

    # ── 融資融券 ────────────────────────────────────────────
    print()
    print('【四、資券情況】')
    print(thin)
    mb = margin.get('margin_balance')
    ml = margin.get('margin_limit')
    sb = margin.get('short_balance')
    if mb is not None:
        util = mb / ml * 100 if ml else 0
        print(f'  融資餘額: {_fmt_int(mb)} 張  (使用率 {util:.1f}%)')
        print(f'  融券餘額: {_fmt_int(sb)} 張')
        if mb and sb:
            print(f'  券資比  : {sb/mb*100:.1f}%')
    else:
        print('  融資融券資料: 無法取得')

    # ── 權證 ────────────────────────────────────────────────
    print()
    print('【五、權證籌碼】')
    print(thin)
    cp = warrant.get('cp_ratio')
    if cp is not None:
        print(f'  認購(Call)餘量: {_fmt_int(warrant.get("call_balance"))}')
        print(f'  認售(Put) 餘量: {_fmt_int(warrant.get("put_balance"))}')
        sentiment = '偏多' if cp >= 55 else ('偏空' if cp < 45 else '中性')
        print(f'  C/P比: {cp:.0f}% / {100-cp:.0f}%  →  市場情緒 {sentiment}')
    else:
        print('  權證資料: 無法取得')

    # ── 新聞 ────────────────────────────────────────────────
    if news:
        print()
        print('【六、近期相關新聞】')
        print(thin)
        for i, n in enumerate(news[:6], 1):
            title = n.get('title', '')[:46]
            t     = n.get('time', '')
            if isinstance(t, int):
                try:
                    from datetime import timezone
                    t = datetime.fromtimestamp(t, tz=timezone.utc).strftime('%m/%d %H:%M')
                except Exception:
                    t = ''
            print(f'  {i}. [{t}] {title}')

    # ── 分析結果 ────────────────────────────────────────────
    print()
    print(sep)
    print('  📈  綜合評分與建議')
    print(sep)
    print()

    max_scores = [30, 20, 15, 15, 20]
    for (cat, (sc, reasons)), max_sc in zip(result.breakdown.items(), max_scores):
        bar = _bar(sc, max_sc)
        print(f'  {cat}: {sc:>4.1f}/{max_sc}  {bar}')
        for r in reasons:
            print(f'       • {r}')
        print()

    print(thin)
    total = result.score
    full_bar = _bar(total, 100)
    print(f'  總分: {total:.1f}/100  {full_bar}')
    print()
    print(f'  🎯  操作建議: {result.action}')
    print()
    print(f'  💰  建議掛買價: ≤ {result.target_buy}  (約 NAV 附近或小幅折價)')
    print(f'  💰  建議掛賣價: ≥ {result.target_sell}')
    print()
    print('  ⚠️  本報告為量化參考，不構成投資建議，請自行評估風險。')
    print(sep)
    print()
