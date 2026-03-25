import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { useFolioUpload, triggerDownload, formatBytes } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

function FileItem({ item, onRemove }) {
  return (
    <Reorder.Item
      value={item}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        background: '#111',
        border: '0.5px solid rgba(255,255,255,0.06)',
        borderRadius: '3px',
        cursor: 'grab',
        listStyle: 'none',
      }}
      whileDrag={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 10 }}
    >
      {/* Drag handle */}
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ opacity: 0.3, flexShrink: 0, cursor: 'grab' }}>
        <circle cx="3" cy="3" r="1" fill="currentColor" />
        <circle cx="7" cy="3" r="1" fill="currentColor" />
        <circle cx="3" cy="7" r="1" fill="currentColor" />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
        <circle cx="3" cy="11" r="1" fill="currentColor" />
        <circle cx="7" cy="11" r="1" fill="currentColor" />
      </svg>

      {/* PDF icon */}
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" style={{ color: `${ACCENT}80`, flexShrink: 0 }}>
        <path d="M2 1 L9 1 L13 5 L13 15 L2 15 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M9 1 L9 5 L13 5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginTop: '2px', display: 'flex', gap: '10px' }}>
          {item.page_count != null && <span>{item.page_count} pages</span>}
          {item.size != null && <span>{formatBytes(item.size)}</span>}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.file_id)}
        style={{ background: 'none', border: 'none', color: 'rgba(240,235,225,0.25)', cursor: 'pointer', padding: '2px', lineHeight: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#E05252')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,235,225,0.25)')}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </button>
    </Reorder.Item>
  )
}

export default function Merge() {
  const [files, setFiles] = useState([]) // [{ file_id, name, page_count, size }]
  const [addState, setAddState] = useState(null)
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  const totalPages = files.reduce((s, f) => s + (f.page_count || 0), 0)

  async function handleAddFile(file) {
    setAddState('uploading')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/folio/upload', { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed') }
      const data = await res.json()
      setFiles((prev) => [...prev, { ...data, name: file.name }])
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    } finally {
      setAddState(null)
    }
  }

  const handleRemove = (fileId) => setFiles((prev) => prev.filter((f) => f.file_id !== fileId))

  async function handleMerge() {
    if (files.length < 2) return
    setOpState('processing')
    setOpMessage('Merging PDFs…')
    try {
      await triggerDownload('/folio/merge', 'POST', { file_ids: files.map((f) => f.file_id) }, 'merged.pdf')
      setOpState('success')
      setOpMessage('Merged PDF downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {files.length === 0 ? (
        <EmptyState icon="merge" message="Add PDFs to merge" sub="Drag to reorder before merging" />
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {/* File list — reorderable */}
          <Reorder.Group axis="y" values={files} onReorder={setFiles} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, margin: 0 }}>
            {files.map((item) => (
              <FileItem key={item.file_id} item={item} onRemove={handleRemove} />
            ))}
          </Reorder.Group>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.3)' }}>
              {files.length} files · {totalPages} pages total
            </span>
          </div>
        </div>
      )}

      {/* Add more + merge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <DropZone
          label={addState === 'uploading' ? 'Adding…' : 'Add another PDF'}
          loading={addState === 'uploading'}
          onFile={handleAddFile}
          accent={ACCENT}
        />

        <AnimatePresence>
          {files.length >= 2 && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleMerge}
              disabled={opState === 'processing'}
              style={{
                width: '100%',
                height: '48px',
                background: ACCENT,
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '3px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                letterSpacing: '0.1em',
                cursor: opState === 'processing' ? 'not-allowed' : 'pointer',
                opacity: opState === 'processing' ? 0.6 : 1,
                fontWeight: 500,
                transition: 'opacity 0.2s',
              }}
            >
              {opState === 'processing' ? 'MERGING…' : 'MERGE & DOWNLOAD'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
