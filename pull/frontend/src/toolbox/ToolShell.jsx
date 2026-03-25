import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getToolById } from '../config/tools.config'

function useBackendAlive(endpoint) {
  const [alive, setAlive] = useState(null)
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(3000) })
        if (!cancelled) setAlive(res.ok)
      } catch {
        if (!cancelled) setAlive(false)
      }
    }
    check()
    const id = setInterval(check, 6000)
    return () => { cancelled = true; clearInterval(id) }
  }, [endpoint])
  return alive
}

const shellVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function ToolShell({ toolId, onBack, children }) {
  const tool = getToolById(toolId)
  const alive = useBackendAlive(tool?.healthEndpoint || '')

  if (!tool) return null

  return (
    <motion.div
      variants={shellVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#080808',
      }}
    >
      {/* ── Slim top bar ──────────────────────────── */}
      <div
        style={{
          height: '48px',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          paddingInline: '20px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          background: '#080808',
          zIndex: 50,
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(240,235,225,0.4)',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '12px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0',
            transition: 'color 0.15s ease',
            minWidth: '100px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F0EBE1')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,235,225,0.4)')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="11" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <polyline points="6.5,4 3,7 6.5,10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          TOOLBOX
        </button>

        {/* Tool name — centered */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic',
              fontSize: '17px',
              color: '#F0EBE1',
              fontWeight: 400,
            }}
          >
            {tool.name}
          </span>
        </div>

        {/* Backend status dot */}
        <div
          style={{
            minWidth: '100px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: 'rgba(240,235,225,0.2)',
              letterSpacing: '0.04em',
            }}
          >
            {alive === null ? 'checking' : alive ? 'online' : 'offline'}
          </span>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background:
                alive === null
                  ? 'rgba(240,235,225,0.2)'
                  : alive
                  ? '#4CAF7D'
                  : '#E05252',
              display: 'inline-block',
              transition: 'background 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* ── Tool content ──────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </motion.div>
  )
}
