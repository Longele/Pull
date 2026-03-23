import { useState, useCallback } from 'react'

const API_BASE = ''

export function useVideoInfo() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchInfo = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch(`${API_BASE}/info?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.error) {
        // Still set a fallback info so the user can attempt the download
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
