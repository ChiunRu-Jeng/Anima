"""
Demo mode — realistic sample data for 0050 (May 2026).
Used when --demo flag is passed or network is unavailable.
"""

PRICE = {
    'date':       '2026/05/26',
    'open':        196.30,
    'high':        197.80,
    'low':         195.60,
    'close':       197.20,
    'change':        0.95,
    'change_pct':    0.48,
    'volume':    18_432,
}

INSTITUTIONAL = {
    'foreign_net':  3_245,
    'site_net':       812,
    'dealer_net':    -230,
    'total_net':    3_827,
}

FUTURES = {
    'futures_foreign_net': 6_200,   # 外資台指期淨多單 口數
}

MARGIN = {
    'margin_buy':       1_200,
    'margin_sell':        980,
    'margin_balance':  42_300,
    'margin_limit':   600_000,
    'short_sell':         450,
    'short_buy':          310,
    'short_balance':    5_820,
    'offset':             140,
}

ETF_NAV = {
    'nav':          196.85,
    'close':        197.20,
    'premium_pct':   0.178,
}

# Technical indicators (pre-calculated from 60-day history)
TECH = {
    'k':            38.5,
    'd':            44.2,
    'rsi':          52.3,
    'ma5':         196.10,
    'ma20':        193.50,
    'ma60':        188.20,
    'current_close': 197.20,
    'vol_ratio':      1.35,
    'ma_trend':    'strong_bull',
}

US_MARKETS = {
    'sp500_chg':     1.12,
    'sp500_close': 5_842.30,
    'nasdaq_chg':    1.45,
    'nasdaq_close': 19_230.80,
    'sox_chg':       2.30,
    'sox_close':    5_120.40,
}

TAIEX = {
    'close':     22_340.0,
    'change':        87.5,
    'change_pct':     0.39,
}

FX = {
    'usdtwd':     30.850,
    'usdtwd_chg': -0.085,   # 台幣升值
}

NEWS = [
    {'title': '外資連六買台股 台積電、0050雙雙走高',          'time': '05/26 14:30', 'url': ''},
    {'title': '台股加權指數站穩22000點 ETF申購熱',            'time': '05/26 12:15', 'url': ''},
    {'title': '元大台灣50 ETF淨值創新高 法人持續加碼',        'time': '05/25 18:00', 'url': ''},
    {'title': '費城半導體指數強彈 台積電ADR大漲帶動0050',     'time': '05/25 09:05', 'url': ''},
    {'title': '0050單週吸金逾百億 散戶定期定額創新高',        'time': '05/24 16:00', 'url': ''},
    {'title': '美Fed維持利率不變 亞股普漲台股受惠',           'time': '05/24 08:30', 'url': ''},
]
