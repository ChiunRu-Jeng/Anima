import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Taipei'
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENWEATHER_API_KEY not configured' },
      { status: 503 }
    )
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_tw`,
    { next: { revalidate: 600 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({
    city: data.name,
    temp: Math.round(data.main.temp),
    feels: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    wind: Math.round(data.wind.speed * 3.6),
  })
}
