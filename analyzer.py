"""
Scoring and analysis logic for 0050 daily buy/sell recommendation.

Scoring system (total 100 points, higher = more bullish):
  - 法人動向        30 pts  (外資+投信+自營商 net flow)
  - 籌碼/融資融券   20 pts  (margin ratio, short ratio)
  - 折溢價           15 pts  (NAV premium/discount)
  - 權證情緒         15 pts  (call/put ratio)
  - 大盤趨勢         20 pts  (TAIEX momentum)
"""

from dataclasses import dataclass


@dataclass
class SignalResult:
    score: float          # 0-100
    action: str           # BUY / HOLD / SELL
    target_buy: float     # suggested buy price
    target_sell: float    # suggested sell price
    breakdown: dict       # per-category scores and reasons
    summary: str          # one-line verdict


def _score_institutional(inst: dict, price: dict) -> tuple[float, list[str]]:
    """
    Score based on 三大法人 net buy/sell.
    Reference: outstanding shares of 0050 ≈ 6 billion shares.
    Use share count relative to avg daily volume as signal strength.
    """
    reasons = []
    score = 15.0  # neutral baseline

    foreign = inst.get('foreign_net') or 0
    site    = inst.get('site_net') or 0
    dealer  = inst.get('dealer_net') or 0
    total   = inst.get('total_net') or (foreign + site + dealer)

    avg_vol = price.get('volume') or 1_000_000
    total_ratio = total / avg_vol  # +1 = net buy equal to full day volume

    # Foreign investors: weight 0.6 (most influential for 0050)
    f_ratio = foreign / avg_vol
    if f_ratio > 0.5:
        score += 10; reasons.append(f'外資大幅買超 {foreign:+,} 張 ({f_ratio:+.1%})')
    elif f_ratio > 0.1:
        score += 5;  reasons.append(f'外資小幅買超 {foreign:+,} 張')
    elif f_ratio < -0.5:
        score -= 10; reasons.append(f'外資大幅賣超 {foreign:+,} 張 ({f_ratio:+.1%})')
    elif f_ratio < -0.1:
        score -= 5;  reasons.append(f'外資小幅賣超 {foreign:+,} 張')
    else:
        reasons.append(f'外資中性 {foreign:+,} 張')

    # Investment trust
    if site > 0:
        score += 3;  reasons.append(f'投信買超 {site:+,} 張')
    elif site < 0:
        score -= 3;  reasons.append(f'投信賣超 {site:+,} 張')

    # Dealers
    if dealer > 0:
        score += 2;  reasons.append(f'自營商買超 {dealer:+,} 張')
    elif dealer < 0:
        score -= 2;  reasons.append(f'自營商賣超 {dealer:+,} 張')

    score = max(0, min(30, score))
    return score, reasons


def _score_margin(margin: dict) -> tuple[float, list[str]]:
    """Score based on margin/short balance changes."""
    reasons = []
    score = 10.0  # neutral baseline

    mb = margin.get('margin_balance') or 0
    ml = margin.get('margin_limit') or 1
    sb = margin.get('short_balance') or 0

    margin_util = mb / ml if ml else 0

    if margin_util < 0.1:
        score += 5; reasons.append(f'融資使用率低 ({margin_util:.1%}) — 籌碼乾淨')
    elif margin_util < 0.25:
        score += 2; reasons.append(f'融資使用率適中 ({margin_util:.1%})')
    elif margin_util > 0.5:
        score -= 5; reasons.append(f'融資使用率高 ({margin_util:.1%}) — 風險偏高')
    else:
        reasons.append(f'融資使用率 {margin_util:.1%}')

    if mb > 0 and sb > 0:
        ls_ratio = sb / mb
        if ls_ratio > 0.15:
            score += 3; reasons.append(f'融券比高 ({ls_ratio:.1%}) — 軋空動能')
        elif ls_ratio > 0.05:
            reasons.append(f'融券比 {ls_ratio:.1%}')

    score = max(0, min(20, score))
    return score, reasons


def _score_nav(etf_nav: dict) -> tuple[float, list[str]]:
    """Score based on premium/discount to NAV."""
    reasons = []
    score = 7.5  # neutral baseline

    pct = etf_nav.get('premium_pct')
    nav = etf_nav.get('nav')
    close = etf_nav.get('close')

    if pct is None:
        reasons.append('淨值資料無法取得')
        return score, reasons

    tag = '溢價' if pct > 0 else '折價'
    if pct < -0.3:
        score += 7.5; reasons.append(f'顯著折價 {pct:+.3f}% — 便宜買入機會')
    elif pct < -0.1:
        score += 3;   reasons.append(f'小幅折價 {pct:+.3f}%')
    elif pct > 0.3:
        score -= 5;   reasons.append(f'顯著溢價 {pct:+.3f}% — 偏貴')
    elif pct > 0.1:
        score -= 2;   reasons.append(f'小幅溢價 {pct:+.3f}%')
    else:
        reasons.append(f'接近淨值 ({tag} {abs(pct):.3f}%)')

    if nav:
        reasons.append(f'NAV={nav:.2f}，收盤={close:.2f}')

    score = max(0, min(15, score))
    return score, reasons


def _score_warrant(warrant: dict) -> tuple[float, list[str]]:
    """Score based on call/put outstanding balance ratio."""
    reasons = []
    score = 7.5  # neutral baseline

    cp = warrant.get('cp_ratio')
    call = warrant.get('call_balance') or 0
    put  = warrant.get('put_balance') or 0

    if cp is None:
        reasons.append('權證資料無法取得')
        return score, reasons

    if cp > 70:
        score += 7.5; reasons.append(f'認購佔比高 {cp:.0f}% — 市場偏多')
    elif cp > 55:
        score += 3;   reasons.append(f'認購偏多 {cp:.0f}%')
    elif cp < 30:
        score -= 7.5; reasons.append(f'認售佔比高 ({100-cp:.0f}%) — 市場偏空')
    elif cp < 45:
        score -= 3;   reasons.append(f'認售偏多 ({100-cp:.0f}%)')
    else:
        reasons.append(f'認購/認售比 {cp:.0f}%/{100-cp:.0f}%')

    score = max(0, min(15, score))
    return score, reasons


def _score_taiex(taiex: dict) -> tuple[float, list[str]]:
    """Score based on TAIEX (大盤) trend."""
    reasons = []
    score = 10.0  # neutral

    chg_pct = taiex.get('change_pct')
    chg     = taiex.get('change')
    close   = taiex.get('close')

    if chg_pct is None:
        reasons.append('大盤資料無法取得')
        return score, reasons

    if chg_pct > 1.5:
        score += 10; reasons.append(f'大盤強勢上漲 {chg_pct:+.2f}%')
    elif chg_pct > 0.5:
        score += 5;  reasons.append(f'大盤小幅上漲 {chg_pct:+.2f}%')
    elif chg_pct < -1.5:
        score -= 10; reasons.append(f'大盤大跌 {chg_pct:+.2f}%')
    elif chg_pct < -0.5:
        score -= 5;  reasons.append(f'大盤小幅下跌 {chg_pct:+.2f}%')
    else:
        reasons.append(f'大盤平盤 {chg_pct:+.2f}%')

    if close:
        reasons.append(f'加權指數收 {close:,.0f} 點')

    score = max(0, min(20, score))
    return score, reasons


def _calc_price_targets(price: dict, etf_nav: dict) -> tuple[float, float]:
    """
    Calculate suggested buy/sell price based on technical levels.
    Buy: slightly below close or near NAV if discount
    Sell: slightly above close
    """
    close = price.get('close') or 0
    nav   = etf_nav.get('nav') or close
    low   = price.get('low') or close
    high  = price.get('high') or close

    # Buy target: lower of (close - 0.2%) and (nav + 0.1%)
    buy_from_close = round(close * 0.998, 2)
    buy_from_nav   = round(nav * 1.001, 2)
    target_buy = min(buy_from_close, buy_from_nav)

    # Sell target: slightly above high of day / close + 0.3%
    target_sell = round(max(close * 1.003, high * 1.001), 2)

    return target_buy, target_sell


def analyze(price: dict, inst: dict, margin: dict, etf_nav: dict,
            warrant: dict, taiex: dict) -> SignalResult:
    """
    Run all scoring models and return a SignalResult.
    """
    s_inst,    r_inst    = _score_institutional(inst, price)
    s_margin,  r_margin  = _score_margin(margin)
    s_nav,     r_nav     = _score_nav(etf_nav)
    s_warrant, r_warrant = _score_warrant(warrant)
    s_taiex,   r_taiex   = _score_taiex(taiex)

    total = s_inst + s_margin + s_nav + s_warrant + s_taiex

    # Determine action
    if total >= 65:
        action = '建議買入 ✅'
    elif total >= 50:
        action = '偏多觀望 🔼'
    elif total >= 38:
        action = '中性持有 ⏸'
    elif total >= 25:
        action = '偏空觀望 🔽'
    else:
        action = '建議減碼 ❌'

    target_buy, target_sell = _calc_price_targets(price, etf_nav)

    close = price.get('close', 0)
    summary = (
        f"綜合評分 {total:.1f}/100 → {action}｜"
        f"收盤 {close}｜建議掛買 ≤{target_buy}｜建議掛賣 ≥{target_sell}"
    )

    breakdown = {
        '法人動向  (30分)': (round(s_inst, 1),    r_inst),
        '資券情況  (20分)': (round(s_margin, 1),  r_margin),
        '折溢價    (15分)': (round(s_nav, 1),     r_nav),
        '權證情緒  (15分)': (round(s_warrant, 1), r_warrant),
        '大盤趨勢  (20分)': (round(s_taiex, 1),   r_taiex),
    }

    return SignalResult(
        score=round(total, 1),
        action=action,
        target_buy=target_buy,
        target_sell=target_sell,
        breakdown=breakdown,
        summary=summary,
    )
