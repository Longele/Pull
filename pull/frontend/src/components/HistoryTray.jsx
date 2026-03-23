import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = ''

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryTray() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/history`)
        .then((r) => r.json())
        .then(setHistory)
        .catch(() => {})
    }
  }, [open])

  return (
    <div className="history-tray" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.35)',
        }}>
          Recent Downloads
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', color: 'rgba(245,240,232,0.35)' }}
        >
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
            <polyline points="1,1 6,6 11,1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 0 8px' }}>
              {history.length === 0 ? (
                <div style={{
                  padding: '20px 24px',
                  fontSize: '13px',
                  color: 'rgba(245,240,232,0.25)',
                  fontFamily: '"DM Sans", sans-serif',
                }}>
                  No downloads yet.
                </div>
              ) : (
                history.map((item, i) => (
                  <div
                    key={item.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 24px',
                      borderTop: '0.5px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Tiny thumbnail */}
                    <div style={{ width: '24px', height: '24px', flexShrink: 0, overflow: 'hidden', background: '#1A1A1A' }}>
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.3)' }}
                        />
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(245,240,232,0.75)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: '"DM Sans", sans-serif',
                      }}>
                        {item.title}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '2px', alignItems: 'center' }}>
                        {item.platform && (
                          <span style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '9px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(245,240,232,0.3)',
                          }}>
                            · {item.platform}
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          color: 'rgba(245,240,232,0.25)',
                          fontFamily: '"DM Sans", sans-serif',
                        }}>
                          {formatTime(item.timestamp)}
                        </span>
                        {item.size && (
                          <span style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '9px',
                            color: 'rgba(245,240,232,0.2)',
                          }}>
                            {item.size.slice(0, 30)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Re-download icon */}
                    <button
                      title="Copy URL"
                      onClick={() => navigator.clipboard?.writeText(item.url)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(201,168,76,0.5)',
                        padding: '4px',
                        flexShrink: 0,
                        fontSize: '14px',
                        lineHeight: 1,
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#C9A84C'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(201,168,76,0.5)'}
                    >
                      ↓
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
