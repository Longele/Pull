import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function classifyLine(text) {
  if (text.toUpperCase().includes('ERROR')) return 'log-error'
  if (/merging|done|✓/i.test(text)) return 'log-success'
  if (text.includes('%')) return 'log-progress'
  return 'log-normal'
}

export default function LogTerminal({ lines, visible }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="log-terminal">
        <AnimatePresence initial={false}>
          {lines.map((line, i) => (
            <motion.div
              key={i}
              className={`log-line ${classifyLine(line.text)}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  )
}
