import { useState, useRef, useCallback } from 'react'

const API_BASE = ''

export function useDownloadStream() {
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('')
  const [eta, setEta] = useState('')
  const esRef = useRef(null)
  const doneRef = useRef(false)

  const startDownload = useCallback(({ url, format, quality, subtitles, embedThumbnail, audioOnly, overwrite, customFilename, contentType }) => {
    if (esRef.current) {
      esRef.current.close()
    }
    setLines([])
    setStatus('loading')
    setProgress(0)
    setSpeed('')
    setEta('')
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
        esRef.current = null
        setStatus('done')
        setProgress(100)
        setSpeed('')
        setEta('')
        return
      }

      if (text === '[ERROR]') {
        doneRef.current = true
        es.close()
        esRef.current = null
        setStatus('error')
        return
      }

      // Parse yt-dlp progress: "[download]  45.2% of ~12.34MiB at 2.50MiB/s ETA 00:04"
      const pctMatch = text.match(/(\d+\.\d+)%/)
      if (pctMatch) {
        setProgress(Math.min(parseFloat(pctMatch[1]), 95))
      }

      const speedMatch = text.match(/at\s+([\d.]+\s*[KMG]iB\/s)/i)
      if (speedMatch) setSpeed(speedMatch[1])

      const etaMatch = text.match(/ETA\s+(\d+:\d+(?::\d+)?)/)
      if (etaMatch) setEta(etaMatch[1])

      let type = 'normal'
      if (text.includes('%')) type = 'progress'
      if (text.toUpperCase().includes('ERROR')) type = 'error'
      if (/merging|done|✓/i.test(text)) type = 'success'

      setLines((prev) => [...prev, { text, type }])
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      if (!doneRef.current) {
        setStatus('error')
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setLines([])
    setStatus('idle')
    setProgress(0)
    setSpeed('')
    setEta('')
  }, [])

  return { lines, status, progress, speed, eta, startDownload, reset }
}
