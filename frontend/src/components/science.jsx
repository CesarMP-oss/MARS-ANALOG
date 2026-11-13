import { hasValues, isNotLoaded } from '../api/client.js'
import { METRICS, METRIC_STATUS } from '../catalog/metrics.js'
import { BODY_LABELS } from '../catalog/regions.js'
import { aoiStatus, datasetVerification, formatResolution } from '../state/regions.js'
import { formatLatLon } from '../map/crs.js'
import { BodyBadge, ChartPlaceholder, EmptyState, ErrorState, Field, LoadingState, StatusBadge } from './ui.jsx'

const fmt = (value, digits = 3) =>
  value === null || value === undefined ? '—' : value.toLocaleString('es', { maximumSignificantDigits: digits })

export function ResourceGate({ resource, notLoaded, children }) {
  if (resource.status === 'idle' || resource.status === 'loading') return <LoadingState />
  if (resource.status === 'error') {
    if (isNotLoaded(resource.error)) return notLoaded
    return <ErrorState error={resource.error} />
  }
  return children(resource.body)
}

export function MetricStatusBadge({ status }) {
  const info = METRIC_STATUS[status] ?? { label: 'Pendiente', tone: 'pending' }
  return <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
}

export function PendingAoiNotice({ region }) {
  return (
    <EmptyState title="Sin resultados: la región aún no tiene AOI cargado en la API">
      <p>
        {region?.name ?? 'Esta región'} todavía no tiene límites de análisis versionados en <code>data/aoi/</code>. Las
        métricas se calcularán a partir del hito 3, después de descargar y verificar los DEM.
      </p>
    </EmptyState>
  )
}

export function RegionDetail({ region, metricsResource }) {
  const verification = datasetVerification(region.dataset)
  const aoi = aoiStatus(region)
  const ref = region.reference
  return (
    <article className="region-detail">
      <header className="region-detail-header">
        <div>
          <h3>{region.name}</h3>
          <p className="muted">{region.location}</p>
        </div>
        <div className="badge-row">
          <BodyBadge body={region.body} />
          <StatusBadge tone={region.role === 'reference' ? 'accent' : 'neutral'}>
            {region.role === 'reference' ? 'Referencia' : 'Candidata'}
          </StatusBadge>
        </div>
      </header>
      <p>{region.description}</p>
      <dl className="fields">
        <Field label="Planeta">{BODY_LABELS[region.body]}</Field>
        <Field label="Ubicación">
          {ref ? (
            <>
              {formatLatLon(ref.lat, ref.lon)} · {ref.label}
              {ref.diameterKm && <> · diámetro {fmt(ref.diameterKm, 4)} km</>}
              <br />
              <small className="muted">
                Fuente: <a href={ref.sourceUrl} target="_blank" rel="noreferrer">{ref.source}</a>. Punto de referencia
                para navegación; no es el AOI de análisis.
              </small>
            </>
          ) : (
            <span className="muted">Región representativa por definir: sin coordenadas todavía.</span>
          )}
        </Field>
        <Field label="Modelo digital de elevación">
          {region.dataset ? (
            <>
              {region.dataset.name} <code>{region.dataset.product_id}</code>
            </>
          ) : (
            <span className="muted">No disponible (manifest no cargado)</span>
          )}
        </Field>
        <Field label="Resolución del modelo">{formatResolution(region.dataset)}</Field>
        <Field label="Estado de los datos">
          <div className="badge-row">
            <StatusBadge tone={verification.tone}>{verification.label}</StatusBadge>
            <StatusBadge tone={aoi.tone}>{aoi.label}</StatusBadge>
          </div>
        </Field>
        {metricsResource && (
          <Field label="Métricas">
            <ResourceGate resource={metricsResource} notLoaded={<StatusBadge tone="pending">No calculadas</StatusBadge>}>
              {(body) => <MetricStatusSummary metrics={body.data.metrics} />}
            </ResourceGate>
          </Field>
        )}
      </dl>
    </article>
  )
}

function MetricStatusSummary({ metrics }) {
  const computed = metrics.filter(hasValues).length
  return (
    <StatusBadge tone={computed ? 'ok' : 'pending'}>
      {computed ? `${computed} de ${metrics.length} calculadas` : 'No calculadas'}
    </StatusBadge>
  )
}

export function MetricValues({ summary }) {
  if (!summary || !hasValues(summary)) return null
  const { summary: s, valid_fraction: valid } = summary
  return (
    <dl className="fields compact">
      <Field label="Mediana">
        {fmt(s.median)} {summary.unit}
      </Field>
      <Field label="IQR">
        {fmt(s.iqr)} {summary.unit}
      </Field>
      <Field label="p05 – p95">
        {fmt(s.p05)} – {fmt(s.p95)}
      </Field>
      <Field label="Cobertura válida">{valid === null ? '—' : `${fmt(valid * 100)} %`}</Field>
    </dl>
  )
}

export function MetricCard({ metric, summary }) {
  const status = summary?.status ?? 'not_computed'
  return (
    <article className="metric-card" data-metric={metric.id}>
      <header className="metric-card-header">
        <h3>{metric.name}</h3>
        <MetricStatusBadge status={status} />
      </header>
      <p>{metric.description}</p>
      <dl className="fields compact">
        <Field label="Unidad">{metric.unit}</Field>
        <Field label="Método previsto">{metric.method}</Field>
        <Field label="Referencia">{metric.reference}</Field>
      </dl>
      {hasValues(summary) ? (
        <MetricValues summary={summary} />
      ) : (
        <ChartPlaceholder chart={metric.plannedChart} />
      )}
    </article>
  )
}

export function AciResultView({ result }) {
  if (result.status !== 'ok') {
    return (
      <EmptyState title={result.status === 'insufficient_data' ? 'Datos insuficientes' : 'ACI no calculado'}>
        <p>
          La API devuelve el estado <code>{result.status}</code> para {result.candidate_region_id} frente a{' '}
          {result.reference_region_id}. No se muestra ninguna puntuación.
        </p>
      </EmptyState>
    )
  }
  const { score_interval: interval } = result
  return (
    <div className="aci-result">
      <p className="aci-score">
        <span className="aci-score-value">{fmt(result.score)}</span>
        <span className="muted">
          intervalo {Math.round(interval.level * 100)} %: {fmt(interval.low)} – {fmt(interval.high)}
        </span>
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Distancia W1</th>
            <th>Normalizada</th>
            <th>Similitud</th>
            <th>Peso</th>
          </tr>
        </thead>
        <tbody>
          {result.components.map((c) => (
            <tr key={c.metric}>
              <td>{METRICS.find((m) => m.id === c.metric)?.name ?? c.metric}</td>
              <td>{c.included ? `${fmt(c.distance)} ${c.unit}` : <em>{c.exclusion_reason}</em>}</td>
              <td>{fmt(c.normalized_distance)}</td>
              <td>{fmt(c.similarity)}</td>
              <td>{fmt(c.weight)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">{result.disclaimer}</p>
    </div>
  )
}
