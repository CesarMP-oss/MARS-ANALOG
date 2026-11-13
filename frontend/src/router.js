import { useEffect, useState } from 'react'

export const ROUTES = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/regiones', label: 'Regiones', icon: 'regions' },
  { path: '/mapas', label: 'Mapas', icon: 'map' },
  { path: '/comparador', label: 'Comparador', icon: 'compare' },
  { path: '/analisis', label: 'Análisis', icon: 'analysis' },
  { path: '/aci', label: 'Índice ACI', icon: 'aci' },
]

export function parseHash(hash = '') {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathPart, query = ''] = raw.split('?')
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent)
  return {
    path: `/${segments[0] ?? ''}`,
    params: segments.slice(1),
    query: Object.fromEntries(new URLSearchParams(query)),
  }
}

export function buildHash(path, query = {}) {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
  const search = new URLSearchParams(entries).toString()
  return `#${path}${search ? `?${search}` : ''}`
}

export function navigate(path, query) {
  window.location.hash = buildHash(path, query)
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(typeof window === 'undefined' ? '' : window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
