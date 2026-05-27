"""
Report formatting — outputs a clean terminal report for 0050 daily analysis.
"""
from datetime import datetime, timezone
from analyzer import SignalResult

_BAR_WIDTH = 20


def _bar(score: float, max_score: float) -> str:
    filled = int(score / max_score * _BAR_WIDTH)
    return '█' * filled + '░' * (_BAR_WIDTH - filled)


def _f(v, dec: int = 2) -> str:
    if v is None: return 'N/A'
    return f'{float(v):.{dec}f}'


def _fi(v) -> str:
    if v is None: return 'N/A'
    try: return f'{int(v):,}'
    except Exception: return str(v)


def _fnet(v) -> str:
    if v is None: return 'N/A'
    return f'{int(v):+,}'


def _ts(t) -> str:
    if not t: return ''
    if isinstance(t, int):
        try:
            return datetime.fromtimestamp(t, tz=timezone.utc).strftime('%m/%d %H:%M')
        except Exception:
            return ''
    return str(t)[:16]


def print_report(
    price:   dict,
    inst:    dict,
    futures: dict,
    margin:  dict,
    etf_nav: dict,
    tech:    dict,
    us:      dict,
    taiex:   dict,
    fx:      dict,
    news:    list[dict],
    result:  SignalResult,
) -> None:
    W   = 62
    sep = '═' * W
    thn = '─' * W

    print()
    print(sep)
    date_str = price.get('date', datetime.now().strftime('%Y/%m/%d'))
    print(f'  📊  0050 每日分析報告  —  {date_str}')
    print(sep)

    # ── 一、價格 ────────────────────────────────────────────────
    print('\n【一、價格資訊】')
    print(thn)
    chg     = price.get('change',     0) or 0
    chg_pct = price.get('change_pct', 0) or 0
    arrow   = '▲' if chg >= 0 else '▼'
    print(f'  收盤價  : {_f(price.get("close"))}  {arrow} {abs(chg):.2f} ({chg_pct:+.2f}%)')
    print(f'  開/高/低: {_f(price.get("open"))} / {_f(price.get("high"))} / {_f(price.get("low"))}')
    print(f'  成交張數: {_fi(price.get("volume"))} 張')
    if taiex.get('close'):
        tc = taiex['close']; tp = taiex.get('change_pct', 0)
        print(f'  加權指數: {tc:,.0f} 點  ({tp:+.2f}%)')

    # ── 二、美股 ─────────────────────────────────────────────────
    print('\n【二、美股夜盤】')
    print(thn)
    sp  = us.get('sp500_chg');  sc = us.get('sp500_close')
    nq  = us.get('nasdaq_chg'); nc = us.get('nasdaq_close')
    sox = us.get('sox_chg');    xc = us.get('sox_close')
    def row(label, chg, close):
        if chg is None: return f'  {label}: N/A'
        arrow = '▲' if chg >= 0 else '▼'
        return f'  {label}: {close:>10,.2f}  {arrow} {abs(chg):.2f}%'
    print(row('S&P500   ', sp,  sc))
    print(row('NASDAQ   ', nq,  nc))
    print(row('費半(SOX)', sox, xc))

    # ── 三、淨值 / 折溢價 ────────────────────────────────────────
    print('\n【三、淨值 / 折溢價】')
    print(thn)
    nav = etf_nav.get('nav'); pct = etf_nav.get('premium_pct')
    if nav:
        label = '溢價' if (pct or 0) >= 0 else '折價'
        print(f'  淨值 (NAV): {_f(nav)}')
        print(f'  折溢價    : {label} {abs(pct or 0):.3f}%')
    else:
        print('  淨值資料: 無法取得')

    # ── 四、法人 ─────────────────────────────────────────────────
    print('\n【四、三大法人（張）+ 台指期（口）】')
    print(thn)
    print(f'  外資現貨   : {_fnet(inst.get("foreign_net"))}')
    print(f'  投信       : {_fnet(inst.get("site_net"))}')
    print(f'  自營商     : {_fnet(inst.get("dealer_net"))}')
    print(f'  現貨合計   : {_fnet(inst.get("total_net"))}')
    fn = futures.get('futures_foreign_net')
    if fn is not None:
        tag = '淨多單 (看多)' if fn >= 0 else '淨空單 (看空)'
        print(f'  外資台指期 : {fn:+,} 口  — {tag}')
    else:
        print('  外資台指期 : 無法取得')

    # ── 五、資券 ─────────────────────────────────────────────────
    print('\n【五、資券情況】')
    print(thn)
    mb = margin.get('margin_balance'); ml = margin.get('margin_limit')
    sb = margin.get('short_balance')
    if mb is not None:
        util = mb / ml * 100 if ml else 0
        print(f'  融資餘額: {_fi(mb)} 張  (使用率 {util:.1f}%)')
        print(f'  融券餘額: {_fi(sb)} 張')
        if mb and sb:
            print(f'  券資比  : {sb/mb*100:.1f}%')
    else:
        print('  融資融券: 無法取得')

    # ── 六、技術指標 ─────────────────────────────────────────────
    print('\n【六、技術指標】')
    print(thn)
    k  = tech.get('k');   d   = tech.get('d')
    rsi = tech.get('rsi')
    ma5 = tech.get('ma5'); ma20 = tech.get('ma20'); ma60 = tech.get('ma60')
    vr  = tech.get('vol_ratio'); mt = tech.get('ma_trend', '')
    trend_label = {
        'strong_bull': '多頭排列 ▲▲',
        'bull':        '偏多 ▲',
        'mixed':       '糾結 ⟷',
        'bear':        '偏空 ▼',
        'strong_bear': '空頭排列 ▼▼',
    }.get(mt, mt)
    if k is not None:
        print(f'  KD   : K={k:.1f}  D={d:.1f}')
    else:
        print('  KD   : N/A')
    print(f'  RSI14: {_f(rsi, 1)}')
    print(f'  均線 : MA5={_f(ma5)}  MA20={_f(ma20)}  MA60={_f(ma60)}')
    print(f'  趨勢 : {trend_label}')
    print(f'  量比 : {_f(vr, 2)}x 均量')

    # ── 七、匯率 ─────────────────────────────────────────────────
    print('\n【七、匯率】')
    print(thn)
    usd = fx.get('usdtwd'); uc = fx.get('usdtwd_chg')
    if usd:
        arrow = '▲' if (uc or 0) >= 0 else '▼'
        print(f'  USD/TWD: {usd:.3f}  {arrow} {abs(uc or 0):.3f}')
        note = '台幣升值 — 外資留台' if (uc or 0) < 0 else '台幣貶值 — 外資匯出壓力'
        print(f'  解讀   : {note}')
    else:
        print('  匯率資料: 無法取得')

    # ── 八、新聞 ─────────────────────────────────────────────────
    if news:
        print('\n【八、近期相關新聞】')
        print(thn)
        for i, n in enumerate(news[:6], 1):
            title = n.get('title', '')[:46]
            t     = _ts(n.get('time', ''))
            print(f'  {i}. [{t}] {title}')

    # ── 評分結果 ─────────────────────────────────────────────────
    print()
    print(sep)
    print('  📈  綜合評分與建議')
    print(sep)
    print()

    max_scores = [20, 20, 20, 15, 15, 10]
    for (cat, (sc, reasons)), max_sc in zip(result.breakdown.items(), max_scores):
        bar = _bar(sc, max_sc)
        print(f'  {cat}: {sc:>4.1f}/{max_sc}  {bar}')
        for r in reasons:
            print(f'        • {r}')
        print()

    print(thn)
    print(f'  總分: {result.score:.1f}/100  {_bar(result.score, 100)}')
    print()
    print(f'  🎯  操作建議: {result.action}')
    print()
    print(f'  💰  建議掛買價: ≤ {result.target_buy}  (NAV 附近或小幅折價)')
    print(f'  💰  建議掛賣價: ≥ {result.target_sell}')
    print()
    print('  ⚠️  本報告為量化參考，不構成投資建議，請自行評估風險。')
    print(sep)
    print()
