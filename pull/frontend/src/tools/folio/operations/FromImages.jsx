import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { triggerDownload, formatBytes } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'
const ACCEPT = 'image/jpeg,image/png,image/webp'

function ImageItem({ item, onRemove }) {
  return (
    <Reorder.Item
      value={item}
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#111', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '3px', cursor: 'grab' }}>
        {/* Thumb */}
        <div style={{ width: '36px', height: '36px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
          {item.preview && <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.3)', marginTop: '2px' }}>{formatBytes(item.size)}</div>
        </div>
        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          style={{ background: 'none', border: 'none', color: 'rgba(240,235,225,0.25)', cursor: 'pointer', padding: '2px', lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E05252')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,235,225,0.25)')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function FromImages() {
  const [images, setImages] = useState([]) // [{ id, file, name, size, preview, file_id }]
  const [uploading, setUploading] = useState(false)
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  async function uploadImage(file) {
    const id = crypto.randomUUID()
    const preview = URL.createObjectURL(file)
    // Optimistically add
    setImages((prev) => [...prev, { id, name: file.name, size: file.size, preview, file_id: null }])

    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/folio/upload-image', { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed') }
      const data = await res.json()
      setImages((prev) => prev.map((img) => img.id === id ? { ...img, file_id: data.file_id } : img))
    } catch (e) {
      setImages((prev) => prev.filter((img) => img.id !== id))
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  async function handleFiles(files) {
    setUploading(true)
    await Promise.all(files.map(uploadImage))
    setUploading(false)
  }

  const handleRemove = (id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img?.preview) URL.revokeObjectURL(img.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  async function handleConvert() {
    const ready = images.filter((i) => i.file_id)
    if (ready.length === 0) return
    setOpState('processing')
    setOpMessage('Building PDF…')
    try {
      await triggerDownload('/folio/from-images', 'POST', { file_ids: ready.map((i) => i.file_id) }, 'images_to_pdf.pdf')
      setOpState('success')
      setOpMessage('PDF downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {images.length === 0 ? (
        <EmptyState icon="frompdf" message="Drop images to convert to PDF" sub="Supports JPG, PNG, WebP" />
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <Reorder.Group axis="y" values={images} onReorder={setImages} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, margin: 0 }}>
            {images.map((item) => (
              <ImageItem key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </Reorder.Group>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.25)', marginTop: '12px' }}>
            {images.filter((i) => i.file_id).length} of {images.length} ready
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <DropZone
          label={uploading ? 'Adding…' : 'Add images (JPG, PNG, WebP)'}
          accept={ACCEPT}
          loading={uploading}
          multiple
          onFiles={handleFiles}
          accent={ACCENT}
        />

        {images.length > 0 && (
          <button
            onClick={handleConvert}
            disabled={images.filter((i) => i.file_id).length === 0 || opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px', letterSpacing: '0.1em',
              cursor: 'pointer', fontWeight: 500, opacity: opState === 'processing' ? 0.6 : 1,
            }}
          >
            {opState === 'processing' ? 'BUILDING PDF…' : 'CONVERT TO PDF'}
          </button>
        )}
      </div>
    </div>
  )
}
