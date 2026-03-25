import { useState } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { triggerDownload, formatBytes } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'
const FORMATS = ['jpg', 'png', 'webp']
const DPI_STEPS = [72, 150, 300]

export default function ToImages() {
  const [fileData, setFileData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [format, setFormat] = useState('jpg')
  const [dpiIdx, setDpiIdx] = useState(1)
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  const dpi = DPI_STEPS[dpiIdx]

  async function handleFile(file) {
    setUploading(true)
    setFileData(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/folio/upload', { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed') }
      const data = await res.json()
      setFileData({ ...data, originalName: file.name })
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleConvert() {
    if (!fileData) return
    setOpState('processing')
    setOpMessage(`Converting ${fileData.page_count} pages to ${format.toUpperCase()}…`)
    try {
      await triggerDownload('/folio/to-images', 'POST', {
        file_id: fileData.file_id,
        format,
        dpi,
      }, `pages_${dpi}dpi.zip`)
      setOpState('success')
      setOpMessage('Images downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  // Rough size estimate
  const estSizeMB = fileData ? ((fileData.size / (1024 * 1024)) * (dpi / 150) * (format === 'png' ? 4 : 1.2)).toFixed(1) : null

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="images" message="Upload a PDF to convert to images" sub="Exports each page as an image file" />
      ) : (
        <>
          {/* Format toggle */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)', marginBottom: '10px' }}>FORMAT</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    padding: '8px 18px',
                    background: format === f ? `${ACCENT}15` : 'transparent',
                    border: `0.5px solid ${format === f ? ACCENT : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '3px',
                    color: format === f ? ACCENT : 'rgba(240,235,225,0.5)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* DPI slider */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)' }}>DPI</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: ACCENT }}>{dpi} dpi</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={dpiIdx}
                onChange={(e) => setDpiIdx(Number(e.target.value))}
                className="quality-slider"
                style={{ '--accent': ACCENT, accentColor: ACCENT }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {DPI_STEPS.map((d) => (
                <span key={d} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: d === dpi ? ACCENT : 'rgba(240,235,225,0.2)' }}>{d}</span>
              ))}
            </div>
          </div>

          {/* Estimate */}
          <div style={{ padding: '12px 16px', background: '#111', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '20px', display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '3px' }}>OUTPUT</div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.7)' }}>~{fileData.page_count} images</div>
            </div>
            <div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '3px' }}>EST. SIZE</div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.7)' }}>~{estSizeMB} MB</div>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px', letterSpacing: '0.1em',
              cursor: opState === 'processing' ? 'not-allowed' : 'pointer',
              opacity: opState === 'processing' ? 0.6 : 1, fontWeight: 500,
            }}
          >
            {opState === 'processing' ? 'CONVERTING…' : `CONVERT TO ${format.toUpperCase()} — DOWNLOAD ZIP`}
          </button>
        </>
      )}

      <div style={{ marginTop: '20px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />
      </div>
    </div>
  )
}
