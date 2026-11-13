import { FALLBACK_LIMITATION, localizeLimitation } from '../catalog/limitations.js'

// Always-visible scientific disclaimer. Which limitations apply comes from GET /limitations.
export default function LimitationsBanner({ limitations = [] }) {
  const critical = limitations.filter((item) => item.severity === 'critical').map(localizeLimitation)
  return (
    <aside className="limitations-banner" role="note" aria-label="Limitaciones científicas">
      <span className="limitations-icon" aria-hidden="true">!</span>
      {critical.length === 0 ? (
        <p>{FALLBACK_LIMITATION}</p>
      ) : (
        <ul>
          {critical.map((item) => (
            <li key={item.code} data-code={item.code}>
              <strong>{item.title}.</strong> {item.message}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
