import { getComparisons } from '../api/client.js'
import { useApiResource } from '../api/useApiResource.js'
import { SEVERITY_LABELS, localizeLimitation } from '../catalog/limitations.js'
import { METRICS } from '../catalog/metrics.js'
import { REFERENCE_REGION_ID } from '../catalog/regions.js'
import { ResourceGate } from '../components/science.jsx'
import { ChartPlaceholder, EmptyState, Panel, StatusBadge } from '../components/ui.jsx'
import { useAppData, useRegions } from '../state/context.js'

const STEPS = [
  ['Distancia', 'Distancia de Wasserstein 1-D entre las distribuciones de píxeles válidos de Jezero y de la candidata, en unidades físicas.'],
  ['Normalización', 'La distancia se divide por el rango intercuartílico (IQR) de Jezero, de modo que añadir candidatas no cambia las puntuaciones existentes.'],
  ['Similitud', 's = exp(−d̂), un valor en (0, 1] por métrica.'],
  ['Agregación', 'Media ponderada con pesos iguales sobre las métricas incluidas; las excluidas se muestran con su motivo.'],
]

export function AciCandidatesTable({ candidates, results }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Candidata</th>
          <th>Estado</th>
          <th>ACI</th>
          <th>Intervalo</th>
        </tr>
      </thead>
      <tbody>
        {candidates.map((c) => {
          const result = results?.find((r) => r.candidate_region_id === c.id)
          const ok = result?.status === 'ok'
          return (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <StatusBadge tone={ok ? 'ok' : 'pending'}>
                  {ok ? 'Calculado' : result?.status === 'insufficient_data' ? 'Datos insuficientes' : 'Pendiente'}
                </StatusBadge>
              </td>
              <td>{ok ? result.score.toLocaleString('es', { maximumFractionDigits: 3 }) : '—'}</td>
              <td>{ok ? `${result.score_interval.low} – ${result.score_interval.high}` : '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function AciPage() {
  const { limitations } = useAppData()
  const regions = useRegions()
  const candidates = regions.filter((r) => r.role === 'candidate')
  const comparisons = useApiResource('comparisons:jezero', (opts) => getComparisons(REFERENCE_REGION_ID, opts))
  const catalog = (limitations.body?.data ?? []).map(localizeLimitation)
  return (
    <div className="aci-page">
      <section className="hero compact">
        <p className="eyebrow">Analog Compatibility Index · versión 0.1 experimental</p>
        <h2 className="hero-title">Un índice explicable de similitud topográfica</h2>
        <p className="hero-text">
          El ACI resume cuánto se parecen las distribuciones de pendiente, rugosidad, relieve local y curvatura de una región
          terrestre a las del cráter Jezero, a una misma escala. No mide habitabilidad, geología ni idoneidad para una base, y
          debe leerse junto con las diferencias de cada métrica.
        </p>
        <StatusBadge tone="pending">Algoritmo pendiente de implementación y validación (hito 4)</StatusBadge>
      </section>

      <div className="steps">
        {STEPS.map(([title, text], i) => (
          <article key={title} className="step">
            <span className="step-index">{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="two-col">
        <Panel title="Métricas que participan">
          <ul className="plain-list">
            {METRICS.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong> <span className="muted">({m.unit})</span>
              </li>
            ))}
          </ul>
          <p className="muted small">
            Pendiente de decidir antes del hito 4: si la curvatura cuenta como una métrica o como dos, y cómo tratar las métricas
            bajo el piso de ruido.
          </p>
        </Panel>
        <Panel title="Comparación con Jezero" subtitle="Resultados servidos por GET /api/v1/comparisons">
          <ResourceGate resource={comparisons} notLoaded={<AciCandidatesTable candidates={candidates} results={[]} />}>
            {(body) => <AciCandidatesTable candidates={candidates} results={body.data} />}
          </ResourceGate>
        </Panel>
      </div>

      <div className="two-col">
        <Panel title="Desglose de puntuaciones">
          <ChartPlaceholder chart="Barras de similitud por métrica, con distancia física y peso" reason="Se mostrará cuando el ACI esté calculado y validado" />
        </Panel>
        <Panel title="Incertidumbre">
          <ChartPlaceholder chart="Intervalo del 90 % por bootstrap espacial por bloques" reason="Se mostrará cuando el ACI esté calculado y validado" />
        </Panel>
      </div>

      <Panel title="Limitaciones científicas" subtitle="Catálogo completo servido por GET /api/v1/limitations">
        {catalog.length === 0 ? (
          <EmptyState title="Catálogo de limitaciones no disponible" />
        ) : (
          <ul className="limitation-list">
            {catalog.map((item) => (
              <li key={item.code} className={`limitation severity-${item.severity}`}>
                <StatusBadge tone={item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warning' : 'neutral'}>
                  {SEVERITY_LABELS[item.severity] ?? item.severity}
                </StatusBadge>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
