import { motion, AnimatePresence } from 'framer-motion'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MiB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GiB'
}

export default function DownloadButton({ status, progress, speed, eta, filesize, onClick }) {
  const isLoading = status === 'loading'
  const isDone = status === 'done'
  const isError = status === 'error'
  const isIdle = status === 'idle'

  const bg = isDone
    ? '#4CAF7D'
    : isError
    ? '#E05252'
    : '#C9A84C'

  return (
    <motion.button
      className="pull-main-btn"
      onClick={onClick}
      disabled={isLoading}
      style={{ background: bg, transition: 'background 0.3s ease' }}
      animate={isDone ? { background: ['#4CAF7D', '#4CAF7D', '#C9A84C'] } : {}}
      transition={isDone ? { duration: 1.5, times: [0, 0.7, 1] } : {}}
      whileTap={!isLoading ? { scale: 0.99 } : {}}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative', zIndex: 1 }}
          >
            <span style={{ opacity: 0.6, fontSize: '11px', letterSpacing: '0.15em' }}>PULLING</span>
            {(speed || eta) && (
              <span style={{ opacity: 0.45, fontSize: '10px', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
                {speed && <span>{speed}</span>}
                {eta && <span style={{ marginLeft: '8px' }}>ETA {eta}</span>}
              </span>
            )}
          </motion.span>
        ) : isDone ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', zIndex: 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline points="2,7 6,11 12,3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            DONE
          </motion.span>
        ) : isError ? (
          <motion.span
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            ERROR — TRY AGAIN
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', zIndex: 1 }}
          >
            PULL IT
            {filesize && (
              <span style={{ opacity: 0.45, fontSize: '10px', letterSpacing: '0.08em', fontFamily: '"JetBrains Mono", monospace' }}>
                ~ {formatBytes(filesize)}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Progress strip */}
      {isLoading && (
        <div
          className="btn-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </motion.button>
  )
}
