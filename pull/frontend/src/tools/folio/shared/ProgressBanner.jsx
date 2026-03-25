import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ProgressBanner — full-width status strip for FOLIO operations.
 * States: 'processing' | 'success' | 'error' | null
 */
export default function ProgressBanner({ state, message, accent = '#7EB88A', onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!!state)
    if (state === 'success') {
      const id = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 2200)
      return () => clearTimeout(id)
    }
  }, [state, onDismiss])

  const colors = {
    processing: accent,
    success: '#4CAF7D',
    error: '#E05252',
  }
  const color = colors[state] || accent

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{
            borderRadius: '4px',
            border: `0.5px solid ${color}30`,
            background: `${color}10`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {state === 'processing' && (
            <ProgressBar accent={accent} message={message} />
          )}
          {state === 'success' && (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#4CAF7D', flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="0.8" />
                <polyline points="4.5,7 6.5,9 9.5,5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#4CAF7D' }}>
                {message || 'Done'}
              </span>
            </>
          )}
          {state === 'error' && (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#E05252', flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="0.8" />
                <line x1="7" y1="4.5" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <circle cx="7" cy="9.5" r="0.6" fill="currentColor" />
              </svg>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#E05252' }}>
                {message || 'An error occurred.'}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ProgressBar({ accent, message }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.6)', marginBottom: '8px' }}>
        {message || 'Processing…'}
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: accent, borderRadius: '1px' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
