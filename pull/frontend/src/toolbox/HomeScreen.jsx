import { motion } from 'framer-motion'
import LiveClock from './LiveClock'
import StatusBar from './StatusBar'
import ToolCard, { PlaceholderCard } from './ToolCard'
import { TOOLS } from '../config/tools.config'

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export default function HomeScreen({ onSelectTool }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        minHeight: '100vh',
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '30px', // account for status bar
      }}
    >
      {/* ── Top bar ─────────────────────────────────── */}
      <header
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: '32px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: '26px',
            color: '#F0EBE1',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          TOOLBOX
        </span>
        <LiveClock />
      </header>

      {/* Thin rule */}
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* ── Main content ────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto',
          padding: '64px 32px 40px',
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.14em',
            color: 'rgba(240,235,225,0.2)',
            marginBottom: '28px',
            textTransform: 'uppercase',
          }}
        >
          Tools
        </div>

        {/* Tool grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
          className="toolbox-grid"
        >
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => onSelectTool(tool.id)}
            />
          ))}
          <PlaceholderCard />
          <PlaceholderCard />
        </div>
      </main>

      {/* ── Status bar ──────────────────────────────── */}
      <StatusBar />
    </motion.div>
  )
}
