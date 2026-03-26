import { useState } from 'react'
import { motion } from 'framer-motion'
import { FolioFileContext } from './FolioContext'
import Merge from './operations/Merge'
import Split from './operations/Split'
import Compress from './operations/Compress'
import RotateDelete from './operations/RotateDelete'
import ToImages from './operations/ToImages'
import FromImages from './operations/FromImages'
import Sign from './operations/Sign'
import Watermark from './operations/Watermark'
import Unlock from './operations/Unlock'

const ACCENT = '#7EB88A'

const NAV_ITEMS = [
  { id: 'merge', label: 'Merge', icon: 'merge' },
  { id: 'split', label: 'Split', icon: 'split' },
  { id: 'compress', label: 'Compress', icon: 'compress' },
  { id: 'rotate', label: 'Rotate & Delete', icon: 'rotate' },
  { id: 'to-images', label: 'PDF → Images', icon: 'images' },
  { id: 'from-images', label: 'Images → PDF', icon: 'frompdf' },
  { id: 'sign', label: 'Sign', icon: 'sign' },
  { id: 'watermark', label: 'Watermark', icon: 'watermark' },
  { id: 'unlock', label: 'Unlock', icon: 'unlock' },
]

const OP_COMPONENTS = {
  merge: Merge,
  split: Split,
  compress: Compress,
  rotate: RotateDelete,
  'to-images': ToImages,
  'from-images': FromImages,
  sign: Sign,
  watermark: Watermark,
  unlock: Unlock,
}

// ── Nav icons ────────────────────────────────────────────────────────────────
function NavIcon({ icon }) {
  const paths = {
    merge: <><rect x="1" y="2" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><rect x="9" y="2" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M7 6 L9 6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" /><path d="M8 10 L8 14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" /></>,
    split: <><rect x="2" y="1" width="12" height="14" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" /></>,
    compress: <><rect x="2" y="1" width="12" height="14" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M8 4 L5 7 L8 4 L11 7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M5 10 L8 13 L11 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>,
    rotate: <><rect x="3" y="2" width="10" height="12" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M11 2 A5 5 0 0 1 11 14" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" /><polyline points="13,2 11,2 11,4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>,
    images: <><rect x="1" y="3" width="14" height="10" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><circle cx="5" cy="7" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M1 11 L5 8 L8 11 L11 7 L15 11" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" /></>,
    frompdf: <><rect x="1" y="3" width="8" height="10" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><rect x="7" y="5" width="8" height="10" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M11 3 L14 6 L11 8.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>,
    sign: <><rect x="1" y="1" width="14" height="14" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><path d="M4 12 C6 8 8 6 9.5 10 C11 14 13 8 14.5 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" fill="none" /></>,
    watermark: <><rect x="1" y="1" width="14" height="14" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><text x="8" y="11.5" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.6" transform="rotate(-30 8 8)">WM</text></>,
    unlock: <><path d="M5 7 L5 4.5 A3 3 0 0 1 11 4.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" /><rect x="2" y="7" width="12" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" /><circle cx="8" cy="11" r="1.2" fill="currentColor" /></>,
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      {paths[icon]}
    </svg>
  )
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, onSelect }) {
  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '0.5px solid rgba(255,255,255,0.05)',
        background: '#080808',
        padding: '24px 0',
        position: 'sticky',
        top: '48px', // below ToolShell top bar
        height: 'calc(100vh - 48px)',
        overflow: 'auto',
      }}
    >
      {/* FOLIO wordmark */}
      <div style={{ paddingInline: '20px', marginBottom: '24px' }}>
        <span
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: '20px',
            color: ACCENT,
            fontWeight: 400,
          }}
        >
          FOLIO
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingInline: '10px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              animate={{
                x: isActive ? 3 : 0,
                background: isActive ? `${ACCENT}10` : 'transparent',
              }}
              transition={{ duration: 0.15 }}
              whileHover={{ x: isActive ? 3 : 3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '3px',
                border: 'none',
                borderLeft: `${isActive ? '2px' : '2px'} solid ${isActive ? ACCENT : 'transparent'}`,
                background: 'transparent',
                color: isActive ? ACCENT : 'rgba(240,235,225,0.45)',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </motion.button>
          )
        })}
      </nav>
    </aside>
  )
}

// ── FolioTool root ────────────────────────────────────────────────────────────
export default function FolioTool() {
  const [activeOp, setActiveOp] = useState('merge')

  // Shared PDF file — persists across all single-PDF operations
  const [sharedFileData, setSharedFileData] = useState(null)
  const [sharedUploading, setSharedUploading] = useState(false)
  const [sharedUploadError, setSharedUploadError] = useState(null)

  async function handleSharedFile(file) {
    setSharedUploading(true)
    setSharedFileData(null)
    setSharedUploadError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/folio/upload', { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed') }
      const data = await res.json()
      setSharedFileData({ ...data, originalName: file.name })
    } catch (e) {
      setSharedUploadError(e.message || 'Upload failed.')
    } finally {
      setSharedUploading(false)
    }
  }

  const activeItem = NAV_ITEMS.find((n) => n.id === activeOp) || NAV_ITEMS[0]

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 48px)', background: '#080808' }}>
      <Sidebar active={activeOp} onSelect={setActiveOp} />

      {/* Main content area */}
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        {/* Breadcrumb + action area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: 'rgba(240,235,225,0.25)', letterSpacing: '0.06em' }}>
              FOLIO
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>›</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: ACCENT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {activeItem.label}
            </span>
          </div>
        </div>

        {/* Operation panels — file state lives in context so it persists across switches */}
        <FolioFileContext.Provider value={{
          fileData: sharedFileData,
          uploading: sharedUploading,
          uploadError: sharedUploadError,
          handleFile: handleSharedFile,
        }}>
          {(() => {
            const Comp = OP_COMPONENTS[activeOp]
            return Comp ? <Comp key={activeOp} /> : null
          })()}
        </FolioFileContext.Provider>
      </main>
    </div>
  )
}
