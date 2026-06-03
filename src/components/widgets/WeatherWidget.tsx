'use client'
import { useEffect, useState } from 'react'
import { Droplets, Wind, Thermometer, MapPin } from 'lucide-react'

interface WeatherData {
  city: string
  temp: number
  feels: number
  humidity: number
  description: string
  icon: string
  wind: number
}

const WEATHER_ICON_MAP: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('Taipei')
  const [inputCity, setInputCity] = useState('Taipei')

  const fetchWeather = async (c: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(c)}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        setData(null)
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWeather(city) }, [city])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[#94a3b8] text-sm">
        載入天氣中...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full px-4">
        <p className="text-[#94a3b8] text-sm text-center">需要設定 OPENWEATHER_API_KEY</p>
        <div className="flex gap-2">
          <input
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            placeholder="輸入城市"
            className="bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg px-3 py-1.5 w-32 outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={() => setCity(inputCity)}
            className="bg-[#3b82f6] text-white text-sm px-3 py-1.5 rounded-lg"
          >
            搜尋
          </button>
        </div>
      </div>
    )
  }

  const emoji = WEATHER_ICON_MAP[data.icon] || '🌡️'

  return (
    <div className="flex flex-col justify-between h-full px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1 text-[#94a3b8] text-xs mb-1">
            <MapPin size={12} />
            <span>{data.city}</span>
          </div>
          <div className="text-5xl font-bold text-[#f1f5f9]">{data.temp}°</div>
          <div className="text-sm text-[#94a3b8] mt-1 capitalize">{data.description}</div>
        </div>
        <div className="text-5xl">{emoji}</div>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
          <Thermometer size={12} />
          <span>體感 {data.feels}°</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
          <Droplets size={12} />
          <span>{data.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
          <Wind size={12} />
          <span>{data.wind} km/h</span>
        </div>
      </div>
    </div>
  )
}
