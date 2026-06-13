'use client'

import { useCallback, useRef, useState, useSyncExternalStore } from 'react'

interface ImageSlotProps {
  /** Stable id used as the localStorage key so uploads persist across reloads. */
  id: string
  /** Corner radius in px. */
  radius?: number
  /** Hint shown inside the empty slot. */
  placeholder?: string
  /** Optional default image shown until the user drops their own photo. */
  defaultSrc?: string
  style?: React.CSSProperties
}

/** Subscribe to cross-tab storage changes for this key. */
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

/** Stable server snapshot — no localStorage on the server. */
const getServerSnapshot = () => null

/**
 * Drag-and-drop image slot — a faithful port of the prototype's <image-slot>.
 * Shows `defaultSrc` (a tasteful stand-in) until the user drops or browses a
 * photo, at which point the upload fills the frame and is saved to
 * localStorage so it survives a refresh. If the default image fails to load,
 * the slot falls back to the dashed placeholder rather than a broken icon.
 */
export default function ImageSlot({ id, radius = 18, placeholder, defaultSrc, style }: ImageSlotProps) {
  const storageKey = `kh-img:${id}`

  // Persisted value, read SSR-safely from localStorage (null on the server).
  // Memoize getSnapshot so its reference is stable across renders and React
  // doesn't re-subscribe on every render.
  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(storageKey)
    } catch {
      return null
    }
  }, [storageKey])
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Freshly uploaded image (this session) takes precedence over the snapshot.
  const [override, setOverride] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [defaultFailed, setDefaultFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploaded = override ?? persisted
  const usingDefault = !uploaded && !!defaultSrc && !defaultFailed
  const src = uploaded ?? (usingDefault ? defaultSrc! : null)

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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
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
        background: '#E7DFD0',
        border: src ? '1px solid rgba(50,46,41,0.08)' : '1.5px dashed rgba(94,114,89,0.55)',
        outline: dragging ? '2px solid #5E7259' : 'none',
        outlineOffset: 2,
        transition: 'outline .15s, border-color .15s',
        ...style,
      }}
    >
      {src ? (
        // A plain <img> is intentional: it loads the photo client-side (the
        // remote stand-ins and user-uploaded data URLs can't go through
        // next/image's server-side optimizer), and supports onError fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={placeholder ?? ''}
          onError={() => {
            // Only the remote default can fail; uploaded data URLs won't.
            if (usingDefault) setDefaultFailed(true)
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
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
          <span style={{ fontSize: 14, lineHeight: 1.6, color: '#7A7268', maxWidth: '22em' }}>{placeholder}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#5E7259', letterSpacing: 1 }}>拖入照片 · 或點此 browse files</span>
        </div>
      )}

      {/* Subtle hint that a stand-in image can be replaced by dropping a photo. */}
      {src && usingDefault && (
        <span
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            fontSize: 11,
            letterSpacing: 0.5,
            color: '#F6F1E9',
            background: 'rgba(46,42,38,0.55)',
            padding: '4px 10px',
            borderRadius: 999,
            backdropFilter: 'blur(2px)',
          }}
        >
          示意圖 · 拖入照片可替換
        </span>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={(e) => ingest(e.target.files?.[0])} style={{ display: 'none' }} />
    </div>
  )
}
