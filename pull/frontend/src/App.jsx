import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import VideoCard from './components/VideoCard'
import Configurator from './components/Configurator'
import DownloadButton from './components/DownloadButton'
import LogTerminal from './components/LogTerminal'
import HistoryTray from './components/HistoryTray'
import { useVideoInfo } from './hooks/useVideoInfo'
import { useDownloadStream } from './hooks/useDownloadStream'

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
  const [url, setUrl] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [config, setConfig] = useState({
    format: 'mp4',
    quality: '720p',
    subtitles: false,
    embedThumbnail: false,
    audioOnly: false,
  })
  const [fileConflict, setFileConflict] = useState(null) // { filename, resolve }
  const [renameValue, setRenameValue] = useState('')

  const { info, loading: infoLoading, error: infoError, fetchInfo } = useVideoInfo()
  const { lines, status, progress, speed, eta, startDownload, reset } = useDownloadStream()

  const handleHeroSubmit = async (submittedUrl) => {
    setUrl(submittedUrl)
    setCollapsed(true)
    reset()
    await fetchInfo(submittedUrl)
  }

  const doDownload = (overwrite = 'yes', customFilename = '') => {
    if (!url) return
    startDownload({
      url,
      format: config.format,
      quality: config.quality,
      subtitles: config.subtitles,
      embedThumbnail: config.embedThumbnail,
      audioOnly: config.audioOnly,
      overwrite,
      customFilename,
      contentType: info?.type || 'video',
    })
  }

  const handleDownload = async () => {
    if (!url) return

    // For photos, skip file check — gallery-dl handles naming
    if (info?.type === 'photo') {
      doDownload('yes')
      return
    }

    // If we have no info or fallback info, just try downloading directly
    if (!info || info.fallback || !info.title) {
      doDownload('yes')
      return
    }

    // Determine the file extension
    const ext = config.audioOnly ? 'mp3' : (config.format === 'mp3' ? 'mp3' : config.format === 'webm' ? 'webm' : 'mp4')

    try {
      const res = await fetch(`/check-file?title=${encodeURIComponent(info.title)}&ext=${encodeURIComponent(ext)}`)
      const data = await res.json()

      if (data.exists) {
        setRenameValue(data.filename)
        setFileConflict({ filename: data.filename })
        return
      }
    } catch {
      // If check fails, just proceed with download
    }

    doDownload('yes')
  }

  const handleConflictOverwrite = () => {
    setFileConflict(null)
    doDownload('yes')
  }

  const handleConflictRename = () => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    setFileConflict(null)
    doDownload('rename', trimmed)
  }

  const handleConflictCancel = () => {
    setFileConflict(null)
  }

  const handleNewDownload = () => {
    reset()
    setCollapsed(false)
    setUrl('')
  }

  const showContent = collapsed

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', position: 'relative' }}>
      <GrainOverlay />
      <CustomCursor />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '840px',
          margin: '0 auto',
          padding: '0 28px 120px',
        }}
      >
        <Hero
          onSubmit={handleHeroSubmit}
          collapsed={collapsed}
        />

        <AnimatePresence>
          {showContent && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}
            >
              {/* Loading state */}
              {infoLoading && (
                <div style={{
                  padding: '28px 0',
                  fontSize: '12px',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.08em',
                  color: 'rgba(201,168,76,0.6)',
                }}>
                  Fetching info...
                </div>
              )}

              {/* Error state — subtle warning, doesn't block download */}
              {infoError && !info?.fallback && (
                <div style={{
                  padding: '20px',
                  border: '0.5px solid rgba(224,82,82,0.25)',
                  background: 'rgba(224,82,82,0.05)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '12px',
                  color: '#E05252',
                }}>
                  {infoError}
                </div>
              )}

              {/* Video card */}
              {info && !info.fallback && <VideoCard info={info} />}

              {/* Configurator — hidden for photo posts and fallback */}
              {info && !info.fallback && info.type !== 'photo' && (
                <Configurator config={config} onChange={setConfig} />
              )}

              {/* Spacer */}
              {info && <div style={{ height: '1px' }} />}

              {/* Download button */}
              {(info || infoError) && (
                <DownloadButton
                  status={status}
                  progress={progress}
                  speed={speed}
                  eta={eta}
                  filesize={info?.filesize}
                  onClick={status === 'idle' || status === 'done' || status === 'error' ? handleDownload : undefined}
                />
              )}

              {/* New Download button — appears when done or error */}
              <AnimatePresence>
                {(status === 'done' || status === 'error') && (
                  <motion.button
                    key="new-download"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    onClick={handleNewDownload}
                    className="new-download-btn"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '8px' }}>
                      <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    NEW DOWNLOAD
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Terminal log */}
              <LogTerminal
                lines={lines}
                visible={status !== 'idle' && lines.length > 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History tray - always visible after first use */}
      <HistoryTray />

      {/* File conflict modal */}
      <AnimatePresence>
        {fileConflict && (
          <motion.div
            key="conflict-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={handleConflictCancel}
          >
            <motion.div
              key="conflict-modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="conflict-modal"
            >
              <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.7)', marginBottom: '16px', textTransform: 'uppercase' }}>
                File already exists
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ivory)', marginBottom: '20px', wordBreak: 'break-all', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--amber)' }}>{fileConflict.filename}</span> already exists in your Downloads folder.
              </div>

              {/* Rename input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  RENAME TO
                </label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="url-input"
                  style={{ fontSize: '14px', borderColor: 'rgba(201,168,76,0.3)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleConflictOverwrite} className="conflict-btn conflict-btn-overwrite">
                  OVERWRITE
                </button>
                <button onClick={handleConflictRename} className="conflict-btn conflict-btn-rename">
                  SAVE AS NEW
                </button>
                <button onClick={handleConflictCancel} className="conflict-btn conflict-btn-cancel">
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
