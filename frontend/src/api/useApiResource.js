import { useEffect, useState } from 'react'

const IDLE = { status: 'idle', body: null, error: null }
const LOADING = { status: 'loading', body: null, error: null }

// Fetches `fetcher` whenever `key` changes; `key === null` skips the request.
export function useApiResource(key, fetcher) {
  const [state, setState] = useState({ key: null, ...IDLE })

  useEffect(() => {
    if (key === null) return undefined
    const controller = new AbortController()
    fetcher({ signal: controller.signal })
      .then((body) => setState({ key, status: 'success', body, error: null }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setState({ key, status: 'error', body: null, error })
      })
    return () => controller.abort()
    // The key identifies the request; fetcher closures change on every render.
  }, [key]) // oxlint-disable-line react-hooks/exhaustive-deps

  if (key === null) return IDLE
  if (state.key !== key) return LOADING
  return state
}
