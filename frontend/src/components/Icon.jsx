const PATHS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  regions: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 2 6 2v10l-6-2V6z',
  compare: 'M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5V3zm4 0v18h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-5z',
  analysis: 'M4 20V10h3v10H4zm6 0V4h3v16h-3zm6 0v-7h3v7h-3z',
  aci: 'M12 2 3 7v10l9 5 9-5V7l-9-5zm0 3.2L18 8.6v6.8L12 18.8 6 15.4V8.6l6-3.4z',
}

export default function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={PATHS[name] ?? PATHS.dashboard} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
