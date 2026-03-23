import { useState, useRef, useCallback } from 'react'

const API_BASE = ''

export function useDownloadStream() {
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [progress, setProgress] = useState(0)
  const esRef = useRef(null)
  const doneRef = useRef(false)

  const startDownload = useCallback(({ url, format, quality, subtitles, embedThumbnail, audioOnly, overwrite, customFilename, contentType }) => {
    if (esRef.current) {
      esRef.current.close()
    }
    setLines([])
    setStatus('loading')
    setProgress(0)
    doneRef.current = false

    const params = new URLSearchParams({
      url,
      format,
      quality,
      subtitles: subtitles ? 'true' : 'false',
      embed_thumbnail: embedThumbnail ? 'true' : 'false',
      audio_only: audioOnly ? 'true' : 'false',
      overwrite: overwrite || 'yes',
      content_type: contentType || 'video',
    })
    if (customFilename) {
      params.set('custom_filename', customFilename)
    }

    const es = new EventSource(`${API_BASE}/download/stream?${params}`)
    esRef.current = es

    es.onmessage = (e) => {
      const text = e.data

      if (text === '[DONE]') {
        doneRef.current = true
        es.close()
        setStatus('done')
        setProgress(100)
        return
      }

      // Detect progress percent from yt-dlp lines like "[download]  45.2% of ..."
      const pctMatch = text.match(/(\d+\.\d+)%/)
      if (pctMatch) {
        const pct = parseFloat(pctMatch[1])
        // Cap at 90 until confirmed done
        setProgress(Math.min(pct, 90))
      }

      let type = 'normal'
      if (text.includes('%')) type = 'progress'
      if (text.toUpperCase().includes('ERROR')) type = 'error'
      if (/merging|done|✓/i.test(text)) type = 'success'

      setLines((prev) => [...prev, { text, type }])
    }

    es.onerror = () => {
      es.close()
      if (!doneRef.current) {
        setStatus('error')
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (esRef.current) esRef.current.close()
    setLines([])
    setStatus('idle')
    setProgress(0)
  }, [])

  return { lines, status, progress, startDownload, reset }
}
