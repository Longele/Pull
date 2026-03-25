import { useState } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { formatBytes } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

const PRESETS = [
  { id: 'screen', label: 'SCREEN', sub: '72 dpi', desc: 'Smallest file, for sharing' },
  { id: 'ebook', label: 'EBOOK', sub: '150 dpi', desc: 'Balanced', default: true },
  { id: 'print', label: 'PRINT', sub: '300 dpi', desc: 'High quality, for printing' },
]

export default function Compress() {
  const [fileData, setFileData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [quality, setQuality] = useState('ebook')
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')
  const [result, setResult] = useState(null) // { original_size, compressed_size, savings_pct }

  async function handleFile(file) {
    setUploading(true)
    setFileData(null)
    setResult(null)
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

  async function handleCompress() {
    if (!fileData) return
    setOpState('processing')
    setOpMessage('Compressing…')
    setResult(null)
    try {
      const res = await fetch('/folio/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileData.file_id, quality }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Compression failed') }

      // Read size metadata from response headers
      const origSize = parseInt(res.headers.get('X-Original-Size') || '0')
      const compSize = parseInt(res.headers.get('X-Compressed-Size') || '0')
      const savings = parseFloat(res.headers.get('X-Savings-Pct') || '0')

      // Trigger download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compressed_${fileData.originalName || 'document.pdf'}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)

      setResult({ origSize, compSize, savings })
      setOpState('success')
      setOpMessage('Compressed PDF downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="compress" message="Upload a PDF to compress" sub="Reduce file size for sharing" />
      ) : (
        <>
          {/* File info */}
          <div style={{ padding: '12px 16px', background: '#111', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.8)' }}>{fileData.originalName}</div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.3)', marginTop: '3px' }}>
                {fileData.page_count} pages · {formatBytes(fileData.size)}
              </div>
            </div>
          </div>

          {/* Quality presets */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)', marginBottom: '10px' }}>
              QUALITY PRESET
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setQuality(p.id)}
                  style={{
                    padding: '14px 10px',
                    background: quality === p.id ? `${ACCENT}15` : '#0D0F0D',
                    border: `0.5px solid ${quality === p.id ? ACCENT : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', letterSpacing: '0.1em', color: quality === p.id ? ACCENT : 'rgba(240,235,225,0.6)', marginBottom: '4px' }}>
                    {p.label}
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '6px' }}>{p.sub}</div>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: 'rgba(240,235,225,0.35)' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '14px 16px', background: `${ACCENT}08`, border: `0.5px solid ${ACCENT}30`, borderRadius: '3px', marginBottom: '16px', display: 'flex', gap: '24px' }}
            >
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '4px' }}>BEFORE</div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.6)' }}>{formatBytes(result.origSize)}</div>
              </div>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '4px' }}>AFTER</div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: ACCENT }}>{formatBytes(result.compSize)}</div>
              </div>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginBottom: '4px' }}>SAVED</div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: ACCENT }}>{result.savings}%</div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleCompress}
            disabled={opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px', letterSpacing: '0.1em', cursor: opState === 'processing' ? 'not-allowed' : 'pointer',
              opacity: opState === 'processing' ? 0.6 : 1, fontWeight: 500, transition: 'opacity 0.2s',
            }}
          >
            {opState === 'processing' ? 'COMPRESSING…' : 'COMPRESS & DOWNLOAD'}
          </button>
        </>
      )}

      <div style={{ marginTop: '20px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />
      </div>
    </div>
  )
}
