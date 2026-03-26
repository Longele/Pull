import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFolioFile } from '../FolioContext'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { triggerDownload } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

// ── Signature canvas with velocity-based stroke width ────────────────────────
function SignaturePad({ onSignature }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const lastTime = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Set resolution
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    const ctx = canvas.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const onDown = (e) => {
    e.preventDefault()
    drawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    lastTime.current = Date.now()
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 0.8, 0, Math.PI * 2)
    ctx.fillStyle = '#F0EBE1'
    ctx.fill()
  }

  const onMove = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const pos = getPos(e)
    const now = Date.now()
    const dt = Math.max(now - (lastTime.current || now), 1)
    const prev = lastPos.current || pos
    const dx = pos.x - prev.x
    const dy = pos.y - prev.y
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt
    const lineWidth = Math.max(0.6, Math.min(2.8, 3 - velocity * 10))

    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#F0EBE1'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPos.current = pos
    lastTime.current = now
  }

  const onUp = () => {
    drawing.current = false
    lastPos.current = null
    // Extract signature as base64 PNG
    const canvas = canvasRef.current
    onSignature?.(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, rect.width, rect.height)
    onSignature?.(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{
          width: '100%',
          height: '140px',
          display: 'block',
          background: '#0e0e0e',
          border: `0.5px solid ${ACCENT}30`,
          borderRadius: '3px',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />
      <button
        onClick={clear}
        style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'transparent', border: `0.5px solid rgba(255,255,255,0.1)`,
          color: 'rgba(240,235,225,0.4)', borderRadius: '2px', padding: '3px 8px',
          fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
      >
        CLEAR
      </button>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.2)', marginTop: '6px', letterSpacing: '0.04em' }}>
        Draw your signature above
      </div>
    </div>
  )
}

// ── PDF page preview with click-to-place ─────────────────────────────────────
function PDFPreview({ fileId, page = 0, pageDims, sigData, sigPos, sigWidth, onPlace }) {
  const [thumb, setThumb] = useState(null)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!fileId) return
    setThumb(null)
    fetch(`/folio/thumbnail?file_id=${fileId}&page=${page}`)
      .then((r) => r.json())
      .then((d) => setThumb(d.data))
      .catch(() => {})
  }, [fileId, page])

  function handleClick(e) {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width
    const yPct = (e.clientY - rect.top) / rect.height
    const pw = pageDims?.width || 595
    const ph = pageDims?.height || 842
    onPlace?.({ x: xPct * pw, y: yPct * ph })
  }

  const sigH = sigWidth * 0.4

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {thumb ? (
        <img
          ref={imgRef}
          src={thumb}
          alt={`Page ${page + 1}`}
          onClick={handleClick}
          style={{ width: '100%', display: 'block', borderRadius: '2px', cursor: 'crosshair' }}
        />
      ) : (
        <div style={{ width: '100%', aspectRatio: '0.707', background: '#111', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.2)' }}>Loading…</span>
        </div>
      )}

      {/* Sig preview overlay */}
      {sigData && sigPos && imgRef.current && (() => {
        const rect = imgRef.current.getBoundingClientRect()
        const pw = pageDims?.width || 595
        const ph = pageDims?.height || 842
        const xPx = (sigPos.x / pw) * rect.width
        const yPx = (sigPos.y / ph) * rect.height
        const wPx = (sigWidth / pw) * rect.width
        const hPx = (sigH / ph) * rect.height
        return (
          <img
            src={sigData}
            draggable={false}
            style={{
              position: 'absolute',
              left: `${(xPx / rect.width) * 100}%`,
              top: `${(yPx / rect.height) * 100}%`,
              width: `${(wPx / rect.width) * 100}%`,
              height: `${(hPx / rect.height) * 100}%`,
              pointerEvents: 'none',
              opacity: 0.85,
            }}
          />
        )
      })()}

      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.2)', marginTop: '6px' }}>
        Click on the page to place signature
      </div>
    </div>
  )
}

export default function Sign() {
  const { fileData, uploading, handleFile, uploadError } = useFolioFile()
  const [sigData, setSigData] = useState(null)
  const [sigPos, setSigPos] = useState(null)
  const [sigWidth, setSigWidth] = useState(150) // PDF points
  const [selectedPage, setSelectedPage] = useState(0)
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  useEffect(() => { setSigPos(null); setSelectedPage(0); setOpState(null); setOpMessage('') }, [fileData?.file_id])
  // Reset placement when page changes
  useEffect(() => { setSigPos(null) }, [selectedPage])
  useEffect(() => { if (uploadError) { setOpState('error'); setOpMessage(uploadError) } }, [uploadError])

  async function handleSign() {
    if (!fileData || !sigData || !sigPos) return
    setOpState('processing')
    setOpMessage('Embedding signature…')
    try {
      await triggerDownload('/folio/sign', 'POST', {
        file_id: fileData.file_id,
        sig_data: sigData,
        page: selectedPage,
        x: sigPos.x,
        y: sigPos.y,
        w: sigWidth,
        h: sigWidth * 0.4,
      }, 'signed.pdf')
      setOpState('success')
      setOpMessage('Signed PDF downloaded.')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message)
    }
  }

  const ready = fileData && sigData && sigPos

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="sign" message="Upload a PDF to sign" sub="Draw your signature and place it anywhere" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left: Signature pad */}
          <div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)', marginBottom: '10px' }}>
              SIGNATURE
            </div>
            <SignaturePad onSignature={setSigData} />

            {/* Width slider */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.25)', marginBottom: '8px', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                <span>SIGNATURE SIZE</span>
                <span style={{ color: ACCENT }}>{sigWidth}pt</span>
              </div>
              <input
                type="range"
                min={60}
                max={300}
                value={sigWidth}
                onChange={(e) => setSigWidth(Number(e.target.value))}
                className="quality-slider"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Right: PDF preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)' }}>
                PLACEMENT {!sigPos && '— click to place'}
              </div>
              {fileData.page_count > 1 && (
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: 'rgba(240,235,225,0.25)', letterSpacing: '0.06em' }}>
                  PAGE <span style={{ color: ACCENT }}>{selectedPage + 1}</span> / {fileData.page_count}
                </div>
              )}
            </div>

            {/* Page picker */}
            {fileData.page_count > 1 && (
              <div style={{
                display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px',
                maxHeight: '72px', overflowY: 'auto',
              }}>
                {Array.from({ length: fileData.page_count }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPage(i)}
                    style={{
                      minWidth: '28px', height: '26px', padding: '0 6px',
                      background: selectedPage === i ? `${ACCENT}20` : 'transparent',
                      border: `0.5px solid ${selectedPage === i ? ACCENT : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '2px',
                      color: selectedPage === i ? ACCENT : 'rgba(240,235,225,0.35)',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <PDFPreview
              fileId={fileData.file_id}
              page={selectedPage}
              pageDims={fileData.page_dims?.[selectedPage]}
              sigData={sigData}
              sigPos={sigPos}
              sigWidth={sigWidth}
              onPlace={setSigPos}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />

        {fileData && (
          <button
            onClick={handleSign}
            disabled={!ready || opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ready ? ACCENT : 'rgba(126,184,138,0.2)', color: ready ? '#0A0A0A' : `${ACCENT}60`,
              border: 'none', borderRadius: '3px', fontFamily: '"DM Sans", sans-serif', fontSize: '13px',
              letterSpacing: '0.1em', cursor: ready ? 'pointer' : 'not-allowed', fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {!sigData ? 'DRAW SIGNATURE FIRST' : !sigPos ? 'CLICK PAGE TO PLACE' : opState === 'processing' ? 'SIGNING…' : 'SIGN & DOWNLOAD'}
          </button>
        )}
      </div>
    </div>
  )
}
