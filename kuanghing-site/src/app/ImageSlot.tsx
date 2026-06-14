'use client'

import { useState } from 'react'

interface ImageSlotProps {
  /** Kept for backwards-compatible call sites; not used for rendering. */
  id?: string
  /** Corner radius in px. */
  radius?: number
  /** Alt text / fallback caption if the image fails to load. */
  placeholder?: string
  /** Image to display. */
  defaultSrc?: string
  style?: React.CSSProperties
}

/**
 * Display-only image frame. (Previously this allowed drag-and-drop replacement,
 * but on a public site that was confusing — it's now a plain, fixed image.
 * To change a photo, replace the file in /public via the repo.)
 */
export default function ImageSlot({ radius = 18, placeholder, defaultSrc, style }: ImageSlotProps) {
  const [failed, setFailed] = useState(false)
  const showImage = !!defaultSrc && !failed

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: radius,
        overflow: 'hidden',
        background: '#E7DFD0',
        ...style,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={defaultSrc}
          alt={placeholder ?? ''}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            fontSize: 14,
            color: '#7A7268',
          }}
        >
          {placeholder}
        </div>
      )}
    </div>
  )
}
