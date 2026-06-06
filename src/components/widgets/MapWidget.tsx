'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, X } from 'lucide-react'

declare global {
  interface Window {
    google: typeof google
    initGoogleMaps: () => void
  }
}

interface PlaceInfo {
  name: string
  address: string
  lat: number
  lng: number
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export default function MapWidget() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [loaded, setLoaded] = useState(false)
  const [place, setPlace] = useState<PlaceInfo | null>(null)
  const [query, setQuery] = useState('')

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 25.0479, lng: 121.5171 },
      zoom: 13,
      mapId: 'anima-map',
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
    })
    mapInstanceRef.current = map

    if (inputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'name', 'formatted_address'],
      })
      autocompleteRef.current = ac

      ac.addListener('place_changed', async () => {
        const p = ac.getPlace()
        if (!p.geometry?.location) return

        const lat = p.geometry.location.lat()
        const lng = p.geometry.location.lng()

        map.panTo({ lat, lng })
        map.setZoom(15)

        // Remove previous marker
        if (markerRef.current) markerRef.current.map = null

        const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker') as google.maps.MarkerLibrary
        const marker = new AdvancedMarkerElement({ map, position: { lat, lng } })
        markerRef.current = marker

        setPlace({
          name: p.name ?? '',
          address: p.formatted_address ?? '',
          lat,
          lng,
        })
        setQuery(p.name ?? p.formatted_address ?? '')
      })
    }

    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!API_KEY) return

    if (window.google?.maps) {
      initMap()
      return
    }

    window.initGoogleMaps = initMap

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMaps&loading=async`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      delete window.initGoogleMaps
    }
  }, [initMap])

  if (!API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
        <MapPin size={24} className="text-[#94a3b8]" />
        <p className="text-[#94a3b8] text-sm">需要設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        <code className="text-xs text-[#64748b] bg-[#0f172a] px-2 py-1 rounded">
          .env.local
        </code>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Search bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋地點..."
            className="w-full bg-[#0f172a] border border-[#334155] text-[#f1f5f9] text-sm rounded-lg pl-8 pr-8 py-1.5 outline-none focus:border-[#3b82f6] placeholder:text-[#475569]"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setPlace(null) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 rounded-lg overflow-hidden border border-[#334155]">
        <div ref={mapRef} className="w-full h-full" />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1e293b] text-[#94a3b8] text-sm">
            載入地圖中...
          </div>
        )}
      </div>

      {/* Place info */}
      {place && (
        <div className="flex items-start gap-2 px-1">
          <MapPin size={12} className="text-[#3b82f6] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-[#f1f5f9] truncate">{place.name}</div>
            <div className="text-xs text-[#64748b] truncate">{place.address}</div>
          </div>
        </div>
      )}
    </div>
  )
}
