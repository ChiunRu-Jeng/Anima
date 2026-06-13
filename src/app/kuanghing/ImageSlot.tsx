'use client'

import { useCallback, useRef, useState, useSyncExternalStore } from 'react'

interface ImageSlotProps {
  /** Stable id used as the localStorage key so uploads persist across reloads. */
  id: string
  /** Corner radius in px. */
  radius?: number
  /** Hint shown inside the empty slot. */
  placeholder?: string
  style?: React.CSSProperties
}

/** Subscribe to cross-tab storage changes for this key. */
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

/**
 * Drag-and-drop image slot — a faithful port of the prototype's <image-slot>.
 * Drop (or browse) a photo and it fills the frame and is saved to localStorage,
 * so it survives a refresh. Until then it shows a tasteful dashed placeholder.
 */
export default function ImageSlot({ id, radius = 18, placeholder, style }: ImageSlotProps) {
  const storageKey = `kh-img:${id}`

  // Persisted value, read SSR-safely from localStorage (null on the server).
  const persisted = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey)
      } catch {
        return null
      }
    },
    () => null,
  )

  // Freshly uploaded image (this session) takes precedence over the snapshot.
  const [override, setOverride] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const src = override ?? persisted

  const ingest = useCallback(
    (file: File | undefined) => {
      if (!file || !file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result)
        setOverride(dataUrl)
        try {
          localStorage.setItem(storageKey, dataUrl)
        } catch {
          /* quota or unavailable; image still shows for this session */
        }
      }
      reader.readAsDataURL(file)
    },
    [storageKey],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    ingest(e.dataTransfer.files?.[0])
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label={placeholder ?? '上傳圖片'}
      style={{
        display: 'block',
        position: 'relative',
        cursor: 'pointer',
        borderRadius: radius,
        overflow: 'hidden',
        background: src ? `#E7DFD0 center/cover no-repeat url(${src})` : '#E7DFD0',
        border: src ? '1px solid rgba(50,46,41,0.08)' : '1.5px dashed rgba(94,114,89,0.55)',
        outline: dragging ? '2px solid #5E7259' : 'none',
        outlineOffset: 2,
        transition: 'outline .15s, border-color .15s',
        ...style,
      }}
    >
      {!src && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(94,114,89,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#5E7259',
            }}
          >
            ❀
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.6, color: '#7A7268', maxWidth: '22em' }}>
            {placeholder}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#5E7259', letterSpacing: 1 }}>
            拖入照片 · 或點此 browse files
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => ingest(e.target.files?.[0])}
        style={{ display: 'none' }}
      />
    </div>
  )
}
