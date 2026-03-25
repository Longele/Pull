import { useState, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import HomeScreen from './toolbox/HomeScreen'
import ToolShell from './toolbox/ToolShell'
import PullTool from './tools/pull/PullTool'
import FolioTool from './tools/folio/FolioTool'

const TOOL_COMPONENTS = {
  pull: PullTool,
  folio: FolioTool,
}

// ── Film grain SVG filter ─────────────────
function GrainOverlay() {
  const animRef = useRef(null)

  useEffect(() => {
    const handleVisibility = () => {
      if (!animRef.current) return
      if (document.hidden) {
        animRef.current.pauseAnimations?.()
      } else {
        animRef.current.unpauseAnimations?.()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <svg
      ref={animRef}
      className="grain-overlay"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        >
          <animate
            attributeName="seed"
            from="0"
            to="100"
            dur="0.4s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.045" />
    </svg>
  )
}

// ── Custom cursor ─────────────────────────
function CustomCursor() {
  const dotRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    const move = (e) => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        if (dotRef.current) {
          dotRef.current.style.left = e.clientX + 'px'
          dotRef.current.style.top = e.clientY + 'px'
        }
        rafRef.current = null
      })
    }

    const over = (e) => {
      const target = e.target
      const interactive = target.closest('button, a, input, [role="button"], label, .format-toggle')
      setExpanded(!!interactive)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={dotRef}
      className={`cursor-dot ${expanded ? 'expanded' : ''}`}
    />
  )
}

export default function App() {
  const [activeTool, setActiveTool] = useState(null) // null = home

  const handleSelectTool = (toolId) => setActiveTool(toolId)
  const handleBack = () => setActiveTool(null)

  const ActiveTool = activeTool ? TOOL_COMPONENTS[activeTool] : null

  return (
    <div style={{ minHeight: '100vh', background: '#080808', position: 'relative' }}>
      <GrainOverlay />
      <CustomCursor />

      <AnimatePresence mode="wait">
        {!activeTool ? (
          <HomeScreen key="home" onSelectTool={handleSelectTool} />
        ) : (
          <ToolShell key={activeTool} toolId={activeTool} onBack={handleBack}>
            {ActiveTool && <ActiveTool />}
          </ToolShell>
        )}
      </AnimatePresence>
    </div>
  )
}


