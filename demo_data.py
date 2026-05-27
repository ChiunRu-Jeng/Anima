"""
Demo mode — realistic sample data for 0050 (May 2025 range).
Used when --demo flag is passed or network is unavailable.
"""

PRICE = {
    'date': '2026/05/26',
    'open':  196.30,
    'high':  197.80,
    'low':   195.60,
    'close': 197.20,
    'change':  0.95,
    'change_pct': 0.48,
    'volume': 18_432,
}

INSTITUTIONAL = {
    'foreign_net':  3_245,
    'site_net':       812,
    'dealer_net':    -230,
    'total_net':    3_827,
}

MARGIN = {
    'margin_buy':      1_200,
    'margin_sell':       980,
    'margin_balance': 42_300,
    'margin_limit':  600_000,
    'short_sell':        450,
    'short_buy':         310,
    'short_balance':   5_820,
    'offset':            140,
}

ETF_NAV = {
    'nav':          196.85,
    'close':        197.20,
    'premium_pct':   0.178,
}

WARRANT = {
    'call_balance': 285_430,
    'put_balance':   98_760,
    'cp_ratio':      74.3,
}

TAIEX = {
    'close':       22_340.0,
    'change':         87.5,
    'change_pct':      0.39,
}

NEWS = [
    {'title': '外資連六買台股 台積電、0050雙雙走高', 'time': '05/26 14:30', 'url': ''},
    {'title': '台股加權指數站穩22000點 ETF申購熱', 'time': '05/26 12:15', 'url': ''},
    {'title': '元大台灣50 ETF淨值創新高 法人持續加碼', 'time': '05/25 18:00', 'url': ''},
    {'title': '美股收高帶動亞股 台股0050今開高走高', 'time': '05/25 09:05', 'url': ''},
    {'title': '0050單週吸金逾百億 散戶定期定額創新高', 'time': '05/24 16:00', 'url': ''},
]
