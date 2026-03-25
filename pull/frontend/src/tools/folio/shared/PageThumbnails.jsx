import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const ACCENT = '#7EB88A'

/**
 * PageThumbnails — renders a grid of PDF page thumbnails.
 * Lazy-loads each from /folio/thumbnail?file_id=&page=N
 *
 * Props:
 *   fileId       — string
 *   pageCount    — number
 *   selectedPages — Set<number>  (0-indexed)
 *   onToggle(i)  — toggle page selection
 *   accent       — hex accent color
 *   rotations    — { [pageIdx]: degrees } for RotateDelete preview
 */
export default function PageThumbnails({
  fileId,
  pageCount,
  selectedPages = new Set(),
  onToggle,
  accent = ACCENT,
  rotations = {},
}) {
  const [thumbs, setThumbs] = useState({}) // { [i]: 'data:image/png;base64,...' }
  const [loading, setLoading] = useState({}) // { [i]: true/false }

  const loadThumb = useCallback(
    async (i) => {
      if (thumbs[i] || loading[i]) return
      setLoading((prev) => ({ ...prev, [i]: true }))
      try {
        const res = await fetch(`/folio/thumbnail?file_id=${fileId}&page=${i}`)
        if (res.ok) {
          const data = await res.json()
          setThumbs((prev) => ({ ...prev, [i]: data.data }))
        }
      } catch {
        // silent fail — shows placeholder
      } finally {
        setLoading((prev) => ({ ...prev, [i]: false }))
      }
    },
    [fileId, thumbs, loading]
  )

  useEffect(() => {
    // Load first 12 immediately, rest lazily
    const immediate = Math.min(pageCount, 12)
    for (let i = 0; i < immediate; i++) loadThumb(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, pageCount])

  // Load remaining thumbnails with a staggered delay
  useEffect(() => {
    if (pageCount <= 12) return
    const ids = []
    for (let i = 12; i < pageCount; i++) {
      const idx = i
      ids.push(setTimeout(() => loadThumb(idx), (idx - 12) * 80))
    }
    return () => ids.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, pageCount])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '12px',
      }}
    >
      {Array.from({ length: pageCount }, (_, i) => {
        const selected = selectedPages.has(i)
        const rotation = rotations[i] || 0
        const src = thumbs[i]
        const isLoading = loading[i] && !src

        return (
          <motion.div
            key={i}
            onClick={() => onToggle?.(i)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'relative',
              cursor: onToggle ? 'pointer' : 'default',
              borderRadius: '2px',
              overflow: 'hidden',
              border: selected ? `2px solid ${accent}` : '0.5px solid rgba(255,255,255,0.06)',
              boxShadow: selected ? `0 0 0 1px ${accent}20` : 'none',
            }}
          >
            {/* Thumbnail image */}
            {src ? (
              <img
                src={src}
                alt={`Page ${i + 1}`}
                style={{
                  width: '100%',
                  display: 'block',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.25s ease',
                  filter: 'saturate(0.1) brightness(0.9)',
                }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: '0.707',
                  background: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading && (
                  <motion.div
                    style={{ width: '16px', height: '16px', border: `1px solid ${accent}40`, borderTopColor: accent, borderRadius: '50%' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            )}

            {/* Selected overlay */}
            {selected && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `${accent}18`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Page number */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '4px 6px',
                background: 'rgba(0,0,0,0.6)',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                color: selected ? accent : 'rgba(240,235,225,0.4)',
                textAlign: 'center',
                letterSpacing: '0.04em',
              }}
            >
              {i + 1}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
