import { useState } from 'react'

/**
 * useFolioUpload — handles file upload to /folio/upload or /folio/upload-image.
 * Returns { fileData, uploading, uploadError, upload, reset }
 */
export function useFolioUpload(endpoint = '/folio/upload') {
  const [fileData, setFileData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  async function upload(file) {
    setUploading(true)
    setUploadError(null)
    setFileData(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(endpoint, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed.')
      }
      const data = await res.json()
      setFileData(data)
    } catch (e) {
      setUploadError(e.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setFileData(null)
    setUploadError(null)
  }

  return { fileData, uploading, uploadError, upload, reset }
}

/**
 * triggerDownload — fetch a blob and trigger browser download.
 */
export async function triggerDownload(endpoint, method, body, filename) {
  const res = await fetch(endpoint, {
    method,
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Operation failed.')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return res
}

export function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
