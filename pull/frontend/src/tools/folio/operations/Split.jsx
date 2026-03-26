import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFolioFile } from '../FolioContext'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import PageThumbnails from '../shared/PageThumbnails'
import { triggerDownload } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

export default function Split() {
  const { fileData, uploading, handleFile, uploadError } = useFolioFile()
  const [selected, setSelected] = useState(new Set())
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  useEffect(() => { setSelected(new Set()); setOpState(null); setOpMessage('') }, [fileData?.file_id])
  useEffect(() => { if (uploadError) { setOpState('error'); setOpMessage(uploadError) } }, [uploadError])

  function togglePage(i) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function selectAll() {
    if (!fileData) return
    setSelected(new Set(Array.from({ length: fileData.page_count }, (_, i) => i)))
  }

  function clearSelection() { setSelected(new Set()) }

  async function handleExtract() {
    if (!fileData || selected.size === 0) return
    setOpState('processing')
    setOpMessage('Extracting pages…')
    try {
      await triggerDownload('/folio/split', 'POST', {
        file_id: fileData.file_id,
        pages: Array.from(selected).sort((a, b) => a - b),
      }, 'extracted_pages.zip')
      setOpState('success')
      setOpMessage('Pages extracted and downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  async function handleSplitAll() {
    if (!fileData) return
    setOpState('processing')
    setOpMessage('Splitting all pages…')
    try {
      await triggerDownload('/folio/split', 'POST', {
        file_id: fileData.file_id,
        split_all: true,
      }, 'all_pages.zip')
      setOpState('success')
      setOpMessage('All pages split and downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="split" message="Upload a PDF to split" sub="Select pages to extract or split all" />
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.3)' }}>
              {fileData.page_count} pages · {selected.size} selected
            </span>
            <button onClick={selectAll} className="folio-text-btn">Select all</button>
            <button onClick={clearSelection} className="folio-text-btn">Clear</button>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleExtract}
              disabled={selected.size === 0 || opState === 'processing'}
              style={{
                padding: '7px 16px',
                background: selected.size > 0 ? ACCENT : 'rgba(255,255,255,0.05)',
                color: selected.size > 0 ? '#0A0A0A' : 'rgba(240,235,225,0.25)',
                border: 'none',
                borderRadius: '3px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '12px',
                letterSpacing: '0.08em',
                cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              Extract selected
            </button>
            <button
              onClick={handleSplitAll}
              disabled={opState === 'processing'}
              style={{
                padding: '7px 16px',
                background: 'transparent',
                border: `0.5px solid ${ACCENT}50`,
                color: ACCENT,
                borderRadius: '3px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '12px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              Split all pages
            </button>
          </div>

          {/* Page thumbnails */}
          <PageThumbnails
            fileId={fileData.file_id}
            pageCount={fileData.page_count}
            selectedPages={selected}
            onToggle={togglePage}
            accent={ACCENT}
          />
        </>
      )}

      {/* Replace file */}
      <div style={{ marginTop: '24px' }}>
        <DropZone
          label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'}
          loading={uploading}
          onFile={handleFile}
          accent={ACCENT}
        />
      </div>
    </div>
  )
}
