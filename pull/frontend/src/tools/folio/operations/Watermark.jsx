import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'

const ACCENT = '#7EB88A'

const ANGLE_OPTIONS = [
  { label: '0°', value: 0 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 },
]

const POSITION_OPTIONS = [
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Header', value: 'header' },
  { label: 'Footer', value: 'footer' },
]

const COLOR_SWATCHES = [
  { label: 'Ivory', value: '#F0EBE1' },
  { label: 'Muted', value: 'rgba(240,235,225,0.35)' },
  { label: 'Red', value: '#E05252' },
  { label: 'Gold', value: '#C9A84C' },
]

export default function Watermark() {
  const [fileData, setFileData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.15)
  const [fontSize, setFontSize] = useState(48)
  const [angle, setAngle] = useState(45)
  const [position, setPosition] = useState('diagonal')
  const [color, setColor] = useState('#F0EBE1')
  const [preview, setPreview] = useState(null) // base64 page preview
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  async function handleFile(file) {
    setUploading(true)
    setFileData(null)
    setPreview(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/folio/upload', { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed') }
      const data = await res.json()
      setFileData(data)
      // Load first page thumbnail
      const thumbRes = await fetch(`/folio/thumbnail?file_id=${data.file_id}&page=0`)
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json()
        setPreview(thumbData.data)
      }
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleApply() {
    if (!fileData || !text.trim()) return
    setOpState('processing')
    setOpMessage('Applying watermark…')
    try {
      const res = await fetch('/folio/watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileData.file_id,
          text: text.trim(),
          opacity,
          font_size: fontSize,
          angle,
          position,
          color,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'watermarked.pdf'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      setOpState('success')
      setOpMessage('Watermarked PDF downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="watermark" message="Upload a PDF to watermark" sub="Applied to all pages" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Text */}
            <div>
              <Label>WATERMARK TEXT</Label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="url-input"
                style={{ fontSize: '14px', borderColor: `${ACCENT}30` }}
                placeholder="e.g. CONFIDENTIAL"
              />
            </div>

            {/* Opacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Label>OPACITY</Label>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: ACCENT }}>{Math.round(opacity * 100)}%</span>
              </div>
              <input type="range" min={0.05} max={0.6} step={0.01} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="quality-slider" style={{ width: '100%' }} />
            </div>

            {/* Font size */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Label>FONT SIZE</Label>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: ACCENT }}>{fontSize}pt</span>
              </div>
              <input type="range" min={12} max={96} step={4} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="quality-slider" style={{ width: '100%' }} />
            </div>

            {/* Angle */}
            <div>
              <Label>ANGLE</Label>
              <ToggleGroup options={ANGLE_OPTIONS} value={angle} onChange={setAngle} accent={ACCENT} />
            </div>

            {/* Position */}
            <div>
              <Label>POSITION</Label>
              <ToggleGroup options={POSITION_OPTIONS} value={position} onChange={setPosition} accent={ACCENT} />
            </div>

            {/* Color swatches */}
            <div>
              <Label>COLOR</Label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {COLOR_SWATCHES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setColor(s.value)}
                    title={s.label}
                    style={{
                      width: '28px', height: '28px', borderRadius: '3px',
                      background: s.value, border: `${color === s.value ? '2px' : '0.5px'} solid ${color === s.value ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label>PREVIEW — PAGE 1</Label>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              {preview ? (
                <img src={preview} alt="Page 1" style={{ width: '100%', borderRadius: '2px', filter: 'brightness(0.85)', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '0.707', background: '#111', borderRadius: '2px' }} />
              )}
              {/* Preview watermark overlay */}
              {text && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems:
                    position === 'header' ? 'flex-start' : position === 'footer' ? 'flex-end' : 'center',
                  justifyContent: 'center', pointerEvents: 'none', padding: '12px',
                }}>
                  <span style={{
                    color, opacity, fontSize: `${fontSize / 5}px`,
                    fontFamily: '"DM Sans", sans-serif', fontWeight: 400,
                    transform: `rotate(-${angle}deg)`, textTransform: 'uppercase',
                    letterSpacing: '0.1em', whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}>
                    {text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />
        {fileData && (
          <button
            onClick={handleApply}
            disabled={!text.trim() || opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px', letterSpacing: '0.1em',
              cursor: text.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, opacity: opState === 'processing' ? 0.6 : 1,
            }}
          >
            {opState === 'processing' ? 'APPLYING…' : 'APPLY WATERMARK & DOWNLOAD'}
          </button>
        )}
      </div>
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)', marginBottom: '8px' }}>
      {children}
    </div>
  )
}

function ToggleGroup({ options, value, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, padding: '7px 0', background: value === o.value ? `${accent}15` : 'transparent',
            border: `0.5px solid ${value === o.value ? accent : 'rgba(255,255,255,0.08)'}`,
            color: value === o.value ? accent : 'rgba(240,235,225,0.4)',
            borderRadius: '3px', fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
