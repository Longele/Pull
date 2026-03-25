import { useState, useEffect } from 'react'
import { TOOLS } from '../config/tools.config'

function useBackendAlive(endpoint) {
  const [alive, setAlive] = useState(null) // null = checking

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(endpoint, {
          signal: AbortSignal.timeout(3000),
        })
        if (!cancelled) setAlive(res.ok)
      } catch {
        if (!cancelled) setAlive(false)
      }
    }
    check()
    const id = setInterval(check, 6000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [endpoint])

  return alive
}

function ToolStatus({ tool }) {
  const alive = useBackendAlive(tool.healthEndpoint)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: 'rgba(240,235,225,0.25)' }}>{tool.name}</span>
      <span style={{ color: 'rgba(240,235,225,0.15)' }}>·</span>
      <span style={{ color: 'rgba(240,235,225,0.2)' }}>port {tool.port}</span>
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
    </span>
  )
}

export default function StatusBar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30px',
        borderTop: '0.5px solid rgba(255,255,255,0.05)',
        background: '#060606',
        display: 'flex',
        alignItems: 'center',
        paddingInline: '24px',
        gap: '28px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        letterSpacing: '0.05em',
        zIndex: 10,
      }}
    >
      {TOOLS.map((tool) => (
        <ToolStatus key={tool.id} tool={tool} />
      ))}
    </div>
  )
}
