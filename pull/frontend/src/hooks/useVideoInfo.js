import { useState, useCallback, useRef } from 'react'

const API_BASE = ''
const CACHE_TTL = 60_000 // 1 minute

export function useVideoInfo() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cacheRef = useRef(new Map())

  const fetchInfo = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    setInfo(null)

    // Check cache
    const cached = cacheRef.current.get(url)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      if (cached.data.error) {
        setInfo({ type: 'video', title: '', thumbnail: '', fallback: true })
        setError(cached.data.error)
      } else {
        setInfo(cached.data)
      }
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/info?url=${encodeURIComponent(url)}`)
      const data = await res.json()

      // Store in cache
      cacheRef.current.set(url, { data, ts: Date.now() })
      // Limit cache size
      if (cacheRef.current.size > 20) {
        const firstKey = cacheRef.current.keys().next().value
        cacheRef.current.delete(firstKey)
      }

      if (data.error) {
        setInfo({ type: 'video', title: '', thumbnail: '', fallback: true })
        setError(data.error)
      } else {
        setInfo(data)
      }
    } catch (e) {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, error, fetchInfo, setInfo }
}
