import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols') || ''
  if (!symbols) return NextResponse.json([])

  const list = symbols.split(',').map((s) => s.trim()).filter(Boolean)

  const results = await Promise.all(
    list.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 300 },
          }
        )
        if (!res.ok) return { symbol, error: true }
        const json = await res.json()
        const meta = json?.chart?.result?.[0]?.meta
        if (!meta) return { symbol, error: true }
        const price = meta.regularMarketPrice ?? meta.previousClose
        const prev = meta.previousClose ?? price
        if (typeof price !== 'number' || typeof prev !== 'number') {
          return { symbol, error: true }
        }
        const change = price - prev
        const changePct = prev ? (change / prev) * 100 : 0
        return {
          symbol,
          name: meta.shortName || symbol,
          price,
          change: Math.round(change * 100) / 100,
          changePct: Math.round(changePct * 100) / 100,
          currency: meta.currency || 'USD',
        }
      } catch {
        return { symbol, error: true }
      }
    })
  )

  return NextResponse.json(results)
}
