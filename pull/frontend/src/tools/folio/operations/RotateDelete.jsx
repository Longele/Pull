import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFolioFile } from '../FolioContext'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import PageThumbnails from '../shared/PageThumbnails'
import { triggerDownload } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

export default function RotateDelete() {
  const { fileData, uploading, handleFile, uploadError } = useFolioFile()
  const [selected, setSelected] = useState(new Set())
  const [rotations, setRotations] = useState({}) // { [pageIdx]: cumulativeDegrees }
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  useEffect(() => { setSelected(new Set()); setRotations({}); setOpState(null); setOpMessage('') }, [fileData?.file_id])
  useEffect(() => { if (uploadError) { setOpState('error'); setOpMessage(uploadError) } }, [uploadError])

  function togglePage(i) {
    setSelected((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  function applyRotation(deg) {
    setRotations((prev) => {
      const next = { ...prev }
      selected.forEach((i) => { next[i] = ((next[i] || 0) + deg + 360) % 360 })
      return next
    })
  }

  function handleDelete() {
    if (!fileData || selected.size === 0) return
    // Remove from local state preview — actual deletion happens on Apply
    const remaining = fileData.page_count - selected.size
    if (remaining < 1) { setOpState('error'); setOpMessage('Cannot delete all pages.'); return }
    // Mark for deletion (handled in handleApply)
  }

  async function handleApply() {
    if (!fileData) return
    setOpState('processing')
    setOpMessage('Applying changes…')
    try {
      // Convert rotations to string-keyed object as expected by backend
      const rotPayload = {}
      Object.entries(rotations).forEach(([k, v]) => { if (v !== 0) rotPayload[k] = v })

      await triggerDownload('/folio/rotate', 'POST', {
        file_id: fileData.file_id,
        rotations: rotPayload,
        deletions: Array.from(selected).sort((a, b) => a - b),
      }, 'modified.pdf')
      setOpState('success')
      setOpMessage('Modified PDF downloaded.')
      setSelected(new Set())
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="rotate" message="Upload a PDF to edit pages" sub="Rotate or delete individual pages" />
      ) : (
        <>
          {/* Selection info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.3)' }}>
              {selected.size > 0 ? `${selected.size} pages selected` : 'Click pages to select'}
            </span>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="folio-text-btn">Clear selection</button>
            )}
          </div>

          {/* Page grid */}
          <PageThumbnails
            fileId={fileData.file_id}
            pageCount={fileData.page_count}
            selectedPages={selected}
            onToggle={togglePage}
            accent={ACCENT}
            rotations={rotations}
          />

          {/* Floating action bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                style={{
                  position: 'sticky',
                  bottom: '16px',
                  marginTop: '20px',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: `0.5px solid ${ACCENT}30`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                <ActionBtn label="↺ Left" onClick={() => applyRotation(-90)} accent={ACCENT} />
                <ActionBtn label="↻ Right" onClick={() => applyRotation(90)} accent={ACCENT} />
                <div style={{ flex: 1 }} />
                <ActionBtn label="🗑 Delete" onClick={handleDelete} color="#E05252" />
                <button
                  onClick={handleApply}
                  disabled={opState === 'processing'}
                  style={{
                    padding: '8px 20px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
                    fontFamily: '"DM Sans", sans-serif', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  Apply
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div style={{ marginTop: '20px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, accent = '#7EB88A', color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', background: 'transparent',
        border: `0.5px solid ${color || accent}50`,
        color: color || accent,
        borderRadius: '3px', fontFamily: '"DM Sans", sans-serif',
        fontSize: '12px', cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color || accent}15`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  )
}
