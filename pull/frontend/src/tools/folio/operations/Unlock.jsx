import { useState } from 'react'
import DropZone from '../shared/DropZone'
import ProgressBanner from '../shared/ProgressBanner'
import EmptyState from '../shared/EmptyState'
import { triggerDownload } from '../shared/useFolioUpload'

const ACCENT = '#7EB88A'

export default function Unlock() {
  const [fileData, setFileData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [opState, setOpState] = useState(null)
  const [opMessage, setOpMessage] = useState('')

  async function handleFile(file) {
    setUploading(true)
    setFileData(null)
    setPassword('')
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

  async function handleUnlock() {
    if (!fileData) return
    setOpState('processing')
    setOpMessage('Unlocking PDF…')
    try {
      await triggerDownload('/folio/unlock', 'POST', {
        file_id: fileData.file_id,
        password,
      }, `unlocked_${fileData.originalName || 'document.pdf'}`)
      setOpState('success')
      setOpMessage('Unlocked PDF downloaded.')
      setPassword('')
    } catch (e) {
      setOpState('error')
      setOpMessage(e.message.includes('wrong') || e.message.includes('password') ? 'Incorrect password. Please try again.' : e.message)
    }
  }

  return (
    <div>
      <ProgressBanner state={opState} message={opMessage} accent={ACCENT} onDismiss={() => setOpState(null)} />

      {!fileData ? (
        <EmptyState icon="unlock" message="Upload a password-protected PDF" sub="Nothing leaves your machine" />
      ) : (
        <div style={{ maxWidth: '400px' }}>
          {/* File info */}
          <div style={{ padding: '12px 16px', background: '#111', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" style={{ color: `${ACCENT}80`, flexShrink: 0 }}>
              <path d="M2 1 L9 1 L13 5 L13 15 L2 15 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
              <path d="M9 1 L9 5 L13 5" stroke="currentColor" strokeWidth="0.8" fill="none" />
            </svg>
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: 'rgba(240,235,225,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileData.originalName}
            </span>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,235,225,0.25)', display: 'block', marginBottom: '8px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="url-input"
                style={{ fontSize: '15px', borderColor: `${ACCENT}30`, paddingRight: '48px' }}
                placeholder="Enter PDF password"
                autoComplete="off"
              />
              <button
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(240,235,225,0.3)', cursor: 'pointer', padding: '8px',
                }}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1 L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    <path d="M5.5 3 A5 3.5 0 0 1 13 7 A5 3.5 0 0 1 9.5 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
                    <path d="M1 7 A5 3.5 0 0 0 4.5 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7 A6 4 0 0 1 13 7 A6 4 0 0 1 1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
                    <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleUnlock}
            disabled={opState === 'processing'}
            style={{
              width: '100%', height: '48px', background: ACCENT, color: '#0A0A0A', border: 'none', borderRadius: '3px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '13px', letterSpacing: '0.1em',
              cursor: opState === 'processing' ? 'not-allowed' : 'pointer',
              opacity: opState === 'processing' ? 0.6 : 1, fontWeight: 500,
            }}
          >
            {opState === 'processing' ? 'UNLOCKING…' : 'UNLOCK & DOWNLOAD'}
          </button>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <DropZone label={uploading ? 'Uploading…' : fileData ? 'Replace PDF' : 'Drop PDF here'} loading={uploading} onFile={handleFile} accent={ACCENT} />
      </div>
    </div>
  )
}
