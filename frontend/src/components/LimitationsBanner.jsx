// Always-visible scientific disclaimer. Texts come from the API catalog (GET /limitations).
const FALLBACK =
  'MARS-ANALOG mide únicamente similitud topográfica experimental; no evalúa habitabilidad ni idoneidad completa como análogo planetario.'

export default function LimitationsBanner({ limitations = [] }) {
  const critical = limitations.filter((item) => item.severity === 'critical')
  return (
    <aside className="limitations-banner" role="note" aria-label="Limitaciones científicas">
      {critical.length === 0 ? (
        <p>{FALLBACK}</p>
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
