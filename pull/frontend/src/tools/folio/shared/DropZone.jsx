import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * DropZone — shared PDF/image drop target for FOLIO operations.
 * Props:
 *   accept      — MIME types string, e.g. "application/pdf"
 *   label       — text shown in center, e.g. "Drop PDF here"
 *   onFile(File) — called when a file is selected
 *   loading     — boolean, shows processing state
 *   accent      — hex accent color (defaults to sage)
 *   multiple    — allow multiple files
 *   onFiles([File]) — used when multiple=true
 */
export default function DropZone({
  accept = 'application/pdf',
  label = 'Drop PDF here',
  onFile,
  onFiles,
  loading = false,
  accent = '#7EB88A',
  multiple = false,
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    if (multiple && onFiles) {
      onFiles(files)
    } else if (onFile) {
      onFile(files[0])
    }
  }

  const handleChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (multiple && onFiles) {
      onFiles(files)
    } else if (onFile) {
      onFile(files[0])
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  return (
    <motion.div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      animate={{
        borderColor: dragging
          ? accent
          : `${accent}40`,
        background: dragging ? `${accent}08` : 'transparent',
      }}
      transition={{ duration: 0.15 }}
      style={{
        border: `0.5px dashed ${accent}40`,
        borderRadius: '4px',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        gap: '12px',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pulse ring on dragover */}
      {dragging && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            border: `0.5px solid ${accent}`,
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* File icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: `${accent}80` }}>
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '13px',
          color: 'rgba(240,235,225,0.4)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {loading ? 'Processing…' : label}
      </span>

      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          color: 'rgba(240,235,225,0.2)',
          letterSpacing: '0.08em',
        }}
      >
        {loading ? '' : 'or click to browse'}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </motion.div>
  )
}
