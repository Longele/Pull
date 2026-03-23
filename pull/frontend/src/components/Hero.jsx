import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Hero({ onSubmit, collapsed }) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [pasted, setPasted] = useState(false)
  const inputRef = useRef(null)

  const handlePaste = () => {
    setPasted(true)
    setTimeout(() => setPasted(false), 400)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (url.trim()) onSubmit(url.trim())
  }

  // Auto-focus on mount
  useEffect(() => {
    if (!collapsed) inputRef.current?.focus()
  }, [collapsed])

  return (
    <motion.section
      layout
      className="relative flex flex-col items-center justify-center w-full"
      style={{
        minHeight: collapsed ? '0' : '100vh',
        paddingTop: collapsed ? '40px' : '0',
        paddingBottom: collapsed ? '40px' : '0',
      }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            key="wordmark"
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 'clamp(64px, 10vw, 96px)',
                letterSpacing: '-0.04em',
                color: '#F5F0E8',
                lineHeight: 1,
                marginBottom: '12px',
              }}
            >
              PULL
            </h1>
            <p
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: '18px',
                fontStyle: 'italic',
                color: 'rgba(245,240,232,0.5)',
                letterSpacing: '0.01em',
              }}
            >
              Extract anything. Everywhere.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        layout
        onSubmit={handleSubmit}
        className="flex items-end gap-5 w-full"
        style={{ maxWidth: collapsed ? '100%' : '680px' }}
      >
        <div
          className="flex-1 relative"
          style={{
            borderRadius: 0,
            background: pasted ? 'rgba(201,168,76,0.08)' : 'transparent',
            transition: 'background 0.4s ease',
          }}
        >
          <input
            ref={inputRef}
            type="url"
            className="url-input"
            placeholder="Drop a link from anywhere..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPaste={handlePaste}
            autoComplete="off"
            spellCheck={false}
            style={{ paddingRight: url ? '36px' : undefined }}
          />
          {url && (
            <button
              type="button"
              onClick={() => { setUrl(''); inputRef.current?.focus() }}
              aria-label="Clear URL"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(245,240,232,0.35)',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(245,240,232,0.7)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,240,232,0.35)'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <button type="submit" className="pull-btn-text">
          PULL IT
        </button>
      </motion.form>
    </motion.section>
  )
}
