import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// ── PULL card icon: thin-stroke downward arrow ────────────────────────────────
function PullIcon({ hovered }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      animate={hovered ? { y: [0, 4, 0] } : { y: 0 }}
      transition={
        hovered
          ? { duration: 0.4, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 1] }
          : { duration: 0.25 }
      }
    >
      <line
        x1="11"
        y1="3"
        x2="11"
        y2="16"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <polyline
        points="6,12 11,17 16,12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </motion.svg>
  )
}

// ── FOLIO card icon: stacked pages ───────────────────────────────────────────
function FolioIcon({ hovered }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      animate={hovered ? { y: -2 } : { y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* back page */}
      <rect
        x="6"
        y="6"
        width="12"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* middle page */}
      <rect
        x="4"
        y="4"
        width="12"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.65"
      />
      {/* front page */}
      <rect
        x="2"
        y="2"
        width="12"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <line x1="5" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="5" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="5" y1="12.5" x2="9" y2="12.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </motion.svg>
  )
}

const ICONS = { pull: PullIcon, folio: FolioIcon }

export default function ToolCard({ tool, onClick, offline }) {
  const [hovered, setHovered] = useState(false)
  const Icon = ICONS[tool.id] || PullIcon

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={!offline ? onClick : undefined}
      whileTap={!offline ? { scale: 0.98 } : {}}
      style={{
        position: 'relative',
        background: tool.bg,
        border: `0.5px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '4px',
        padding: '28px 24px 24px',
        cursor: offline ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        opacity: offline ? 0.35 : 1,
        transition: 'border-color 0.2s ease, opacity 0.3s ease',
        userSelect: 'none',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
      title={offline ? 'Run backend to activate' : undefined}
    >
      {/* Tag badge — top right */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: tool.accent,
          background: tool.accentDim,
          padding: '3px 7px',
          borderRadius: '2px',
        }}
      >
        {tool.tag}
      </div>

      {/* Icon */}
      <div style={{ color: tool.accent, marginBottom: '20px' }}>
        <Icon hovered={hovered} />
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontStyle: 'italic',
          fontSize: '32px',
          color: '#F0EBE1',
          lineHeight: 1,
          marginBottom: '10px',
          fontWeight: 400,
        }}
      >
        {tool.name}
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '12px',
          color: 'rgba(240,235,225,0.4)',
          fontWeight: 400,
          flex: 1,
        }}
      >
        {tool.tagline}
      </div>

      {/* Bottom accent sweep line */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '1px',
          background: tool.accent,
          transformOrigin: 'left',
        }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        initial={{ scaleX: 0 }}
      />
    </motion.div>
  )
}

// ── Placeholder card for future tools ────────────────────────────────────────
export function PlaceholderCard() {
  return (
    <div
      style={{
        background: '#0A0A0A',
        border: '0.5px dashed rgba(255,255,255,0.04)',
        borderRadius: '4px',
        padding: '28px 24px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.06em',
        }}
      >
        + coming soon
      </span>
    </div>
  )
}
