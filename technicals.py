"""
Technical indicator calculations for OHLCV history data.
All functions accept plain Python lists; no external dependencies.
"""


def calc_rsi(closes: list[float], period: int = 14) -> float | None:
    if len(closes) < period + 2:
        return None
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    gains  = [d if d > 0 else 0.0 for d in deltas]
    losses = [-d if d < 0 else 0.0 for d in deltas]
    avg_g = sum(gains[:period]) / period
    avg_l = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        avg_g = (avg_g * (period - 1) + gains[i]) / period
        avg_l = (avg_l * (period - 1) + losses[i]) / period
    if avg_l == 0:
        return 100.0
    return round(100 - 100 / (1 + avg_g / avg_l), 1)


def calc_kd(highs: list[float], lows: list[float], closes: list[float],
            rsv_period: int = 9) -> tuple[float | None, float | None]:
    """Stochastic KD with RSV period=9, 2/3 smoothing (Taiwan convention)."""
    if len(closes) < rsv_period:
        return None, None
    k, d = 50.0, 50.0
    for i in range(rsv_period - 1, len(closes)):
        hi = max(highs[i - rsv_period + 1: i + 1])
        lo = min(lows[i  - rsv_period + 1: i + 1])
        rsv = (closes[i] - lo) / (hi - lo) * 100 if hi != lo else 50.0
        k = k * 2 / 3 + rsv / 3
        d = d * 2 / 3 + k   / 3
    return round(k, 1), round(d, 1)


def calc_ma(closes: list[float], period: int) -> float | None:
    if len(closes) < period:
        return None
    return round(sum(closes[-period:]) / period, 2)


def calc_technicals(history: list[dict]) -> dict:
    """
    Given a sorted (oldest-first) list of OHLCV dicts, return a dict of indicators:
    k, d, rsi, ma5, ma20, ma60, current_close, vol_ratio, ma_trend
    """
    if not history:
        return {}

    closes = [r['close']  for r in history]
    highs  = [r['high']   for r in history]
    lows   = [r['low']    for r in history]
    vols   = [r['volume'] for r in history]

    k, d   = calc_kd(highs, lows, closes)
    rsi    = calc_rsi(closes)
    ma5    = calc_ma(closes, 5)
    ma20   = calc_ma(closes, 20)
    ma60   = calc_ma(closes, 60)
    close  = closes[-1]

    avg_vol_20  = sum(vols[-20:]) / min(len(vols), 20) if vols else None
    vol_ratio   = round(vols[-1] / avg_vol_20, 2) if avg_vol_20 else None

    # MA trend classification
    ma_trend = 'unknown'
    if close and ma5 and ma20 and ma60:
        if close > ma5 > ma20 > ma60:
            ma_trend = 'strong_bull'
        elif close > ma20 and ma20 > ma60:
            ma_trend = 'bull'
        elif close < ma5 < ma20 < ma60:
            ma_trend = 'strong_bear'
        elif close < ma20 and ma20 < ma60:
            ma_trend = 'bear'
        else:
            ma_trend = 'mixed'

    return {
        'k': k, 'd': d,
        'rsi': rsi,
        'ma5': ma5, 'ma20': ma20, 'ma60': ma60,
        'current_close': close,
        'vol_ratio': vol_ratio,
        'ma_trend': ma_trend,
    }
