import { motion } from 'framer-motion'

function formatDuration(secs) {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function thumbSrc(url) {
  if (!url) return ''
  // Proxy non-YouTube thumbnails to bypass hotlink protection
  if (/instagram|cdninstagram|fbcdn/i.test(url)) {
    return `/proxy-thumb?url=${encodeURIComponent(url)}`
  }
  return url
}

export default function VideoCard({ info }) {
  if (!info) return null

  const { title, thumbnail, duration, uploader, extractor } = info
  const isPhoto = info.type === 'photo'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        border: '0.5px solid rgba(255,255,255,0.08)',
        background: '#0F0F0F',
        display: 'flex',
        gap: '0',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
        style={{ position: 'relative', flexShrink: 0, width: '200px', height: '120px', overflow: 'hidden' }}
      >
        {thumbnail ? (
          <img
            src={thumbSrc(thumbnail)}
            alt={title}
            className="thumb-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1A1A1A' }} />
        )}
        {/* Icon overlay — camera for photos, play for videos */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          {isPhoto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="2" stroke="#C9A84C" strokeWidth="1.5" opacity="0.85" />
              <circle cx="12" cy="13" r="4" stroke="#C9A84C" strokeWidth="1.5" opacity="0.85" />
              <path d="M7 6L8.5 3H15.5L17 6" stroke="#C9A84C" strokeWidth="1.5" opacity="0.85" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <polygon points="7,4 19,11 7,18" fill="#C9A84C" opacity="0.85" />
            </svg>
          )}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.13, ease: 'easeOut' }}
        style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', flex: 1, minWidth: 0 }}
      >
        {extractor && (
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.4)',
          }}>
            · {extractor}
          </div>
        )}
        <h2
          title={title}
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '22px',
            color: '#F5F0E8',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          {uploader && (
            <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.45)' }}>{uploader}</span>
          )}
          {duration && (
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: 'rgba(245,240,232,0.35)',
              letterSpacing: '0.06em',
            }}>
              {formatDuration(duration)}
            </span>
          )}
          {isPhoto && info.photo_count > 0 && (
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '0.06em',
            }}>
              {info.photo_count} photo{info.photo_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
