import { useState, useEffect } from 'react'

export default function LiveClock() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        color: 'rgba(240,235,225,0.3)',
        letterSpacing: '0.06em',
        userSelect: 'none',
      }}
    >
      {time}
    </span>
  )
}

function formatTime(d) {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}
