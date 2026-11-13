import { getComparison, getRegionMetrics, hasValues } from '../api/client.js'
import { useApiResource } from '../api/useApiResource.js'
import { METRICS } from '../catalog/metrics.js'
import { REFERENCE_REGION_ID } from '../catalog/regions.js'
import {
  AciResultView,
  MetricStatusBadge,
  MetricValues,
  PendingAoiNotice,
  ResourceGate,
} from '../components/science.jsx'
import { BodyBadge, ChartPlaceholder, EmptyState, Panel, StatusBadge } from '../components/ui.jsx'
import { buildHash, navigate } from '../router.js'
import { useRegions } from '../state/context.js'
import { datasetVerification, formatResolution, metricFrom } from '../state/regions.js'

const PRESETS = [
  ['uyuni', 'jezero'],
  ['sajama', 'jezero'],
  ['atacama', 'jezero'],
]

function RegionSelect({ label, value, regions, onChange }) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.body === 'mars' ? 'Marte' : 'Tierra'})
          </option>
        ))}
      </select>
    </label>
  )
}

export function RegionColumn({ region, metricsResource }) {
  const verification = datasetVerification(region.dataset)
  return (
    <Panel
      className="compare-column"
      title={region.name}
      subtitle={`${region.dataset?.product_id ?? 'DEM no disponible'} · ${formatResolution(region.dataset)}`}
      actions={<BodyBadge body={region.body} />}
    >
      <ChartPlaceholder title="Modelo de elevación" chart="Relieve sombreado del DEM recortado al AOI" reason={verification.label} />
      <ul className="metric-rows">
        {METRICS.map((metric) => {
          const summary = metricsResource.status === 'success' ? metricFrom(metricsResource.body, metric.id) : null
          return (
            <li key={metric.id} data-metric={metric.id}>
              <div className="metric-row-head">
                <span>
                  {metric.name} <span className="muted small">({metric.unit})</span>
                </span>
                <MetricStatusBadge status={summary?.status ?? 'not_computed'} />
              </div>
              {hasValues(summary) && <MetricValues summary={summary} />}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function comparisonPair(a, b) {
  if (a.id === b.id) return null
  if (a.id === REFERENCE_REGION_ID && b.role === 'candidate') return [a.id, b.id]
  if (b.id === REFERENCE_REGION_ID && a.role === 'candidate') return [b.id, a.id]
  return null
}

export default function ComparePage({ route }) {
  const regions = useRegions()
  const byId = (id, fallback) => regions.find((r) => r.id === id) ?? regions.find((r) => r.id === fallback)
  const a = byId(route.query.a, 'uyuni')
  const b = byId(route.query.b, 'jezero')
  const setPair = (next) => navigate('/comparador', { a: a.id, b: b.id, ...next })
  const metricsA = useApiResource(`metrics:${a.id}`, (opts) => getRegionMetrics(a.id, opts))
  const metricsB = useApiResource(`metrics:${b.id}`, (opts) => getRegionMetrics(b.id, opts))
  const pair = comparisonPair(a, b)
  const comparison = useApiResource(pair ? `cmp:${pair.join(':')}` : null, (opts) =>
    getComparison(pair[0], pair[1], opts),
  )
  return (
    <div className="compare-page">
      <Panel>
        <div className="compare-controls">
          <RegionSelect label="Región A" value={a.id} regions={regions} onChange={(id) => setPair({ a: id })} />
          <button type="button" className="button ghost swap" onClick={() => setPair({ a: b.id, b: a.id })} aria-label="Intercambiar regiones">
            ⇄
          </button>
          <RegionSelect label="Región B" value={b.id} regions={regions} onChange={(id) => setPair({ b: id })} />
          <div className="presets">
            {PRESETS.map(([x, y]) => (
              <a key={x} className="chip" href={buildHash('/comparador', { a: x, b: y })}>
                {byId(x).name} vs. {byId(y).name}
              </a>
            ))}
          </div>
        </div>
      </Panel>
      {a.id === b.id && <EmptyState title="Seleccione dos regiones distintas" />}
      <div className="compare-grid">
        <RegionColumn region={a} metricsResource={metricsA} />
        <RegionColumn region={b} metricsResource={metricsB} />
      </div>
      <Panel title="Similitud topográfica (ACI 0.1)" subtitle="Solo se calcula cada candidata terrestre frente a la referencia Jezero.">
        {pair ? (
          <ResourceGate resource={comparison} notLoaded={<PendingAoiNotice region={byId(pair[1])} />}>
            {(body) => <AciResultView result={body.data} />}
          </ResourceGate>
        ) : (
          <EmptyState title="Sin ACI para este par">
            <p>
              El ACI 0.1 compara una región candidata con la referencia <StatusBadge tone="accent">Cráter Jezero</StatusBadge>.
              Para dos regiones terrestres solo se muestran sus métricas lado a lado.
            </p>
          </EmptyState>
        )}
      </Panel>
    </div>
  )
}
