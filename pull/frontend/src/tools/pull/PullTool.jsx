import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hero from '../../components/Hero'
import VideoCard from '../../components/VideoCard'
import Configurator from '../../components/Configurator'
import DownloadButton from '../../components/DownloadButton'
import LogTerminal from '../../components/LogTerminal'
import HistoryTray from '../../components/HistoryTray'
import { useVideoInfo } from '../../hooks/useVideoInfo'
import { useDownloadStream } from '../../hooks/useDownloadStream'

export default function PullTool() {
  const [url, setUrl] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [config, setConfig] = useState({
    format: 'mp4',
    quality: '720p',
    subtitles: false,
    embedThumbnail: false,
    audioOnly: false,
  })
  const [fileConflict, setFileConflict] = useState(null)
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
    if (info?.type === 'photo') { doDownload('yes'); return }
    if (!info || info.fallback || !info.title) { doDownload('yes'); return }

    const ext = config.audioOnly ? 'mp3' : config.format === 'mp3' ? 'mp3' : config.format === 'webm' ? 'webm' : 'mp4'
    try {
      const res = await fetch(`/check-file?title=${encodeURIComponent(info.title)}&ext=${encodeURIComponent(ext)}`)
      const data = await res.json()
      if (data.exists) {
        setRenameValue(data.filename)
        setFileConflict({ filename: data.filename })
        return
      }
    } catch { /* proceed */ }
    doDownload('yes')
  }

  const handleConflictOverwrite = () => { setFileConflict(null); doDownload('yes') }
  const handleConflictRename = () => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    setFileConflict(null)
    doDownload('rename', trimmed)
  }
  const handleConflictCancel = () => setFileConflict(null)
  const handleNewDownload = () => { reset(); setCollapsed(false); setUrl('') }

  return (
    <div style={{ minHeight: '100%', background: '#0A0A0A', position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '840px',
          margin: '0 auto',
          padding: '0 28px 120px',
        }}
      >
        <Hero onSubmit={handleHeroSubmit} collapsed={collapsed} />

        <AnimatePresence>
          {collapsed && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}
            >
              {infoLoading && (
                <div style={{ padding: '28px 0', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)' }}>
                  Fetching info...
                </div>
              )}
              {infoError && !info?.fallback && (
                <div style={{ padding: '20px', border: '0.5px solid rgba(224,82,82,0.25)', background: 'rgba(224,82,82,0.05)', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#E05252' }}>
                  {infoError}
                </div>
              )}
              {info && !info.fallback && <VideoCard info={info} />}
              {info && !info.fallback && info.type !== 'photo' && (
                <Configurator config={config} onChange={setConfig} />
              )}
              {info && <div style={{ height: '1px' }} />}
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
              <LogTerminal lines={lines} visible={status !== 'idle' && lines.length > 0} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>RENAME TO</label>
                <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="url-input" style={{ fontSize: '14px', borderColor: 'rgba(201,168,76,0.3)' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleConflictOverwrite} className="conflict-btn conflict-btn-overwrite">OVERWRITE</button>
                <button onClick={handleConflictRename} className="conflict-btn conflict-btn-rename">SAVE AS NEW</button>
                <button onClick={handleConflictCancel} className="conflict-btn conflict-btn-cancel">CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
