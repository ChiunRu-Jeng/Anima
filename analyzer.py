"""
Scoring and analysis logic for 0050 daily buy/sell recommendation.

Scoring (100 pts total):
  美股動能   20 pts  S&P500 / NASDAQ / 費半 — leading indicator for TSMC/0050
  法人動向   20 pts  外資現貨 + 台指期外資未平倉 + 投信 + 自營商
  技術面     20 pts  KD / RSI14 / MA multi-timeframe + volume
  大盤趨勢   15 pts  TAIEX daily change
  折溢價     15 pts  ETF premium/discount to NAV
  匯率量能   10 pts  USD/TWD trend
"""

from dataclasses import dataclass, field


@dataclass
class SignalResult:
    score:        float
    action:       str
    target_buy:   float
    target_sell:  float
    breakdown:    dict = field(default_factory=dict)
    summary:      str  = ''
    missing:      list = field(default_factory=list)   # categories with no data
    data_warning: bool = False                          # True when too many sources missing


# ── 1. 美股動能 (20 pts) ─────────────────────────────────────────────────────

def _score_us_markets(us: dict) -> tuple[float, list[str], bool]:
    """Returns (score, reasons, data_missing)."""
    reasons = []
    score   = 10.0

    sp  = us.get('sp500_chg')
    nq  = us.get('nasdaq_chg')
    sox = us.get('sox_chg')

    if sp is None and nq is None:
        reasons.append('美股資料無法取得')
        return score, reasons, True

    # Weighted composite (S&P 40%, NASDAQ 35%, SOX 25%)
    comp, wt = 0.0, 0.0
    for val, w in [(sp, 0.40), (nq, 0.35), (sox, 0.25)]:
        if val is not None:
            comp += val * w; wt += w
    comp = comp / wt if wt else 0.0

    if comp > 2.0:
        score += 10
        reasons.append(f'美股強漲 S&P {sp:+.2f}% / NASDAQ {nq:+.2f}% / 費半 {sox:+.2f}%')
    elif comp > 0.7:
        score += 5
        reasons.append(f'美股上漲 S&P {sp:+.2f}% / 費半 {sox:+.2f}%')
    elif comp < -2.0:
        score -= 10
        reasons.append(f'美股重挫 S&P {sp:+.2f}% / NASDAQ {nq:+.2f}% / 費半 {sox:+.2f}%')
    elif comp < -0.7:
        score -= 5
        reasons.append(f'美股下跌 S&P {sp:+.2f}% / 費半 {sox:+.2f}%')
    else:
        reasons.append(f'美股平盤 S&P {sp:+.2f}%' if sp else '美股小幅波動')

    # Extra SOX bonus/penalty for TSMC weighting in 0050
    if sox is not None:
        if sox > 3.0:
            score += 3
            reasons.append(f'費半強勢 {sox:+.1f}% → 台積電利多')
        elif sox < -3.0:
            score -= 3
            reasons.append(f'費半重挫 {sox:+.1f}% → 台積電壓力')

    return max(0, min(20, score)), reasons, False


# ── 2. 法人動向 (20 pts) ─────────────────────────────────────────────────────

def _score_institutional(inst: dict, futures: dict, price: dict) -> tuple[float, list[str], bool]:
    reasons = []
    score   = 10.0

    foreign = inst.get('foreign_net') or 0
    site    = inst.get('site_net')    or 0
    dealer  = inst.get('dealer_net')  or 0
    avg_vol = price.get('volume') or 1_000_000
    f_ratio = foreign / avg_vol

    # 外資現貨 (weight ~0.55)
    if f_ratio > 0.5:
        score += 8; reasons.append(f'外資大幅買超 {foreign:+,} 張 ({f_ratio:+.1%})')
    elif f_ratio > 0.1:
        score += 4; reasons.append(f'外資買超 {foreign:+,} 張')
    elif f_ratio < -0.5:
        score -= 8; reasons.append(f'外資大幅賣超 {foreign:+,} 張 ({f_ratio:+.1%})')
    elif f_ratio < -0.1:
        score -= 4; reasons.append(f'外資賣超 {foreign:+,} 張')
    else:
        reasons.append(f'外資中性 {foreign:+,} 張')

    # 外資台指期 (weight ~0.25)
    fut_net = futures.get('futures_foreign_net')
    if fut_net is not None:
        if fut_net > 5000:
            score += 4; reasons.append(f'外資期貨淨多單 {fut_net:+,} 口 — 看多')
        elif fut_net > 1000:
            score += 2; reasons.append(f'外資期貨偏多 {fut_net:+,} 口')
        elif fut_net < -5000:
            score -= 4; reasons.append(f'外資期貨淨空單 {fut_net:+,} 口 — 看空')
        elif fut_net < -1000:
            score -= 2; reasons.append(f'外資期貨偏空 {fut_net:+,} 口')
        else:
            reasons.append(f'外資期貨中性 {fut_net:+,} 口')
    else:
        reasons.append('外資台指期資料無法取得')

    # 投信
    if site > 0:
        score += 2; reasons.append(f'投信買超 {site:+,} 張')
    elif site < 0:
        score -= 2; reasons.append(f'投信賣超 {site:+,} 張')

    # 自營商
    if dealer > 0:
        score += 1; reasons.append(f'自營商買超 {dealer:+,} 張')
    elif dealer < 0:
        score -= 1; reasons.append(f'自營商賣超 {dealer:+,} 張')

    missing = inst.get('foreign_net') is None and inst.get('site_net') is None
    return max(0, min(20, score)), reasons, missing


# ── 3. 技術面 (20 pts) ───────────────────────────────────────────────────────

def _score_technical(tech: dict) -> tuple[float, list[str], bool]:
    reasons = []
    score   = 10.0

    if not tech:
        reasons.append('技術指標無法計算（歷史資料不足）')
        return score, reasons, True

    k         = tech.get('k')
    d         = tech.get('d')
    rsi       = tech.get('rsi')
    ma_trend  = tech.get('ma_trend')
    close     = tech.get('current_close')
    ma20      = tech.get('ma20')
    ma60      = tech.get('ma60')
    vol_ratio = tech.get('vol_ratio')

    # KD (6 pts)
    if k is not None and d is not None:
        if k < 20:
            score += 6; reasons.append(f'KD超賣 K={k:.0f} → 強力反彈訊號')
        elif k < 30 and k > d:
            score += 4; reasons.append(f'KD低檔黃金交叉 K={k:.0f} D={d:.0f}')
        elif k > 80:
            score -= 5; reasons.append(f'KD超買 K={k:.0f} → 拉回風險')
        elif k > 70 and k < d:
            score -= 3; reasons.append(f'KD高檔死亡交叉 K={k:.0f} D={d:.0f}')
        else:
            reasons.append(f'KD中性 K={k:.0f} D={d:.0f}')

    # RSI (4 pts)
    if rsi is not None:
        if rsi < 30:
            score += 4; reasons.append(f'RSI超賣 {rsi:.0f} → 反彈機率高')
        elif rsi > 70:
            score -= 4; reasons.append(f'RSI超買 {rsi:.0f} → 短線偏熱')
        else:
            reasons.append(f'RSI {rsi:.0f} (中性區間 30-70)')

    # MA 多空排列 (6 pts)
    trend_map = {
        'strong_bull': ( 6, '均線多頭排列 (價>MA5>MA20>MA60)'),
        'bull':        ( 3, '站上月線與季線'),
        'mixed':       ( 0, '均線糾結 — 方向不明'),
        'bear':        (-3, '跌破月線與季線'),
        'strong_bear': (-6, '均線空頭排列 (價<MA5<MA20<MA60)'),
    }
    if ma_trend in trend_map:
        delta, msg = trend_map[ma_trend]
        score += delta; reasons.append(msg)
    if close and ma20 and ma60:
        reasons.append(f'收盤 {close:.2f}  MA20={ma20:.2f}  MA60={ma60:.2f}')

    # 量能 (4 pts)
    if vol_ratio is not None:
        if vol_ratio > 1.8 and score >= 10:
            score += 4; reasons.append(f'量增價漲 ({vol_ratio:.1f}x均量) — 攻擊訊號')
        elif vol_ratio > 1.8:
            score -= 2; reasons.append(f'量增價跌 ({vol_ratio:.1f}x均量) — 賣壓重')
        elif vol_ratio < 0.5:
            reasons.append(f'量縮 ({vol_ratio:.1f}x均量)')
        else:
            reasons.append(f'量能正常 ({vol_ratio:.1f}x均量)')

    return max(0, min(20, score)), reasons, False


# ── 4. 大盤趨勢 (15 pts) ─────────────────────────────────────────────────────

def _score_taiex(taiex: dict) -> tuple[float, list[str], bool]:
    reasons = []
    score   = 7.5

    chg_pct = taiex.get('change_pct')
    close   = taiex.get('close')

    if chg_pct is None:
        reasons.append('大盤資料無法取得')
        return score, reasons, True

    if chg_pct > 1.5:
        score += 7.5; reasons.append(f'大盤強勢 {chg_pct:+.2f}%')
    elif chg_pct > 0.5:
        score += 3.5; reasons.append(f'大盤小漲 {chg_pct:+.2f}%')
    elif chg_pct < -1.5:
        score -= 7.5; reasons.append(f'大盤重挫 {chg_pct:+.2f}%')
    elif chg_pct < -0.5:
        score -= 3.5; reasons.append(f'大盤小跌 {chg_pct:+.2f}%')
    else:
        reasons.append(f'大盤平盤 {chg_pct:+.2f}%')

    if close:
        reasons.append(f'加權指數 {close:,.0f} 點')

    return max(0, min(15, score)), reasons, False


# ── 5. 折溢價 (15 pts) ───────────────────────────────────────────────────────

def _score_nav(etf_nav: dict) -> tuple[float, list[str], bool]:
    reasons = []
    score   = 7.5

    pct   = etf_nav.get('premium_pct')
    nav   = etf_nav.get('nav')
    close = etf_nav.get('close')

    if pct is None:
        reasons.append('淨值資料無法取得')
        return score, reasons, True

    if pct < -0.3:
        score += 7.5; reasons.append(f'顯著折價 {pct:+.3f}% → 便宜買入機會')
    elif pct < -0.1:
        score += 3;   reasons.append(f'小幅折價 {pct:+.3f}%')
    elif pct > 0.5:
        score -= 7.5; reasons.append(f'顯著溢價 {pct:+.3f}% → 偏貴，等折回')
    elif pct > 0.2:
        score -= 3;   reasons.append(f'小幅溢價 {pct:+.3f}%')
    else:
        label = '溢價' if pct >= 0 else '折價'
        reasons.append(f'接近淨值 ({label} {abs(pct):.3f}%)')

    if nav:
        reasons.append(f'NAV={nav:.2f}  收盤={close:.2f}')

    return max(0, min(15, score)), reasons, False


# ── 6. 匯率量能 (10 pts) ─────────────────────────────────────────────────────

def _score_fx(fx: dict) -> tuple[float, list[str], bool]:
    reasons = []
    score   = 5.0

    usdtwd     = fx.get('usdtwd')
    usdtwd_chg = fx.get('usdtwd_chg')

    if usdtwd_chg is None:
        reasons.append('匯率資料無法取得')
        return score, reasons, True

    if usdtwd_chg < -0.2:
        score += 5; reasons.append(f'新台幣升值 {usdtwd_chg:+.3f} → 外資留台意願高')
    elif usdtwd_chg < -0.05:
        score += 2; reasons.append(f'新台幣小幅升值 {usdtwd_chg:+.3f}')
    elif usdtwd_chg > 0.2:
        score -= 5; reasons.append(f'新台幣貶值 {usdtwd_chg:+.3f} → 外資匯出壓力')
    elif usdtwd_chg > 0.05:
        score -= 2; reasons.append(f'新台幣小幅貶值 {usdtwd_chg:+.3f}')
    else:
        reasons.append(f'匯率平穩 USD/TWD={usdtwd:.3f}')

    return max(0, min(10, score)), reasons, False


# ── 價位計算 ──────────────────────────────────────────────────────────────────

def _calc_price_targets(price: dict, etf_nav: dict) -> tuple[float, float]:
    close = price.get('close') or 0
    nav   = etf_nav.get('nav') or close
    high  = price.get('high')  or close

    # Buy near NAV or slight discount from close
    target_buy  = round(min(close * 0.998, nav * 1.001), 2)
    target_sell = round(max(close * 1.003, high * 1.001), 2)
    return target_buy, target_sell


# ── 主入口 ────────────────────────────────────────────────────────────────────

def analyze(price: dict, inst: dict, futures: dict, margin: dict,
            etf_nav: dict, tech: dict, taiex: dict, fx: dict) -> SignalResult:

    s_us,   r_us   = _score_us_markets(us=fx.get('_us', {}))  # will be overridden
    # Re-wire — us markets passed separately
    s_us,   r_us   = _score_us_markets(us=tech.get('_us', {})) if '_us' in tech else (10.0, ['美股資料無法取得'])
    s_inst, r_inst = _score_institutional(inst, futures, price)
    s_tech, r_tech = _score_technical(tech)
    s_tai,  r_tai  = _score_taiex(taiex)
    s_nav,  r_nav  = _score_nav(etf_nav)
    s_fx,   r_fx   = _score_fx(fx)

    total = s_us + s_inst + s_tech + s_tai + s_nav + s_fx

    if total >= 70:
        action = '強力買入 ✅✅'
    elif total >= 58:
        action = '建議買入 ✅'
    elif total >= 45:
        action = '偏多觀望 🔼'
    elif total >= 35:
        action = '中性持有 ⏸'
    elif total >= 22:
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
        '美股動能   (20分)': (round(s_us,   1), r_us),
        '法人動向   (20分)': (round(s_inst, 1), r_inst),
        '技術面     (20分)': (round(s_tech, 1), r_tech),
        '大盤趨勢   (15分)': (round(s_tai,  1), r_tai),
        '折溢價     (15分)': (round(s_nav,  1), r_nav),
        '匯率量能   (10分)': (round(s_fx,   1), r_fx),
    }

    return SignalResult(
        score=round(total, 1),
        action=action,
        target_buy=target_buy,
        target_sell=target_sell,
        breakdown=breakdown,
        summary=summary,
    )


def analyze_all(price: dict, inst: dict, futures: dict, margin: dict,
                etf_nav: dict, tech: dict, us: dict, taiex: dict, fx: dict) -> SignalResult:
    """
    Public entry point. Returns SignalResult with data_warning=True and
    a blocked action string when >= 3 critical data sources are unavailable.
    """
    s_us,   r_us,   m_us   = _score_us_markets(us)
    s_inst, r_inst, m_inst = _score_institutional(inst, futures, price)
    s_tech, r_tech, m_tech = _score_technical(tech)
    s_tai,  r_tai,  m_tai  = _score_taiex(taiex)
    s_nav,  r_nav,  m_nav  = _score_nav(etf_nav)
    s_fx,   r_fx,   m_fx   = _score_fx(fx)

    # Track which categories are missing
    missing_map = {
        '美股動能': m_us,
        '大盤趨勢': m_tai,
        '折溢價':   m_nav,
        '匯率量能': m_fx,
        '法人動向': m_inst,
        '技術面':   m_tech,
    }
    missing = [k for k, v in missing_map.items() if v]

    # Critical categories: 美股、大盤、法人 — if 2+ are missing, warn
    critical_missing = sum([m_us, m_tai, m_inst])
    data_warning = critical_missing >= 2 or len(missing) >= 3

    total = s_us + s_inst + s_tech + s_tai + s_nav + s_fx

    if data_warning:
        action = '⚠️ 資料不足，請手動查核'
    elif total >= 70:
        action = '強力買入 ✅✅'
    elif total >= 58:
        action = '建議買入 ✅'
    elif total >= 45:
        action = '偏多觀望 🔼'
    elif total >= 35:
        action = '中性持有 ⏸'
    elif total >= 22:
        action = '偏空觀望 🔽'
    else:
        action = '建議減碼 ❌'

    target_buy, target_sell = _calc_price_targets(price, etf_nav)
    close = price.get('close', 0)

    breakdown = {
        '美股動能   (20分)': (round(s_us,   1), r_us),
        '法人動向   (20分)': (round(s_inst, 1), r_inst),
        '技術面     (20分)': (round(s_tech, 1), r_tech),
        '大盤趨勢   (15分)': (round(s_tai,  1), r_tai),
        '折溢價     (15分)': (round(s_nav,  1), r_nav),
        '匯率量能   (10分)': (round(s_fx,   1), r_fx),
    }

    return SignalResult(
        score=round(total, 1),
        action=action,
        target_buy=target_buy,
        target_sell=target_sell,
        breakdown=breakdown,
        missing=missing,
        data_warning=data_warning,
        summary=f"綜合評分 {total:.1f}/100 → {action}｜收盤 {close}",
    )
