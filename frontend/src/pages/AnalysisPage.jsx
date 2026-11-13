import { getRegionMetrics } from '../api/client.js'
import { useApiResource } from '../api/useApiResource.js'
import { METRICS, QUALITY_INDICATORS } from '../catalog/metrics.js'
import { MetricCard, PendingAoiNotice, ResourceGate } from '../components/science.jsx'
import { ChartPlaceholder, Field, Panel, StatusBadge } from '../components/ui.jsx'
import { buildHash } from '../router.js'
import { useRegions } from '../state/context.js'
import { datasetVerification, formatResolution, metricFrom } from '../state/regions.js'

export function MetricsGrid({ body }) {
  return (
    <div className="metric-grid">
      {METRICS.map((metric) => (
        <MetricCard key={metric.id} metric={metric} summary={metricFrom(body, metric.id)} />
      ))}
    </div>
  )
}

export default function AnalysisPage({ route }) {
  const regions = useRegions()
  const region = regions.find((r) => r.id === route.query.region) ?? regions[0]
  const metrics = useApiResource(`metrics:${region.id}`, (opts) => getRegionMetrics(region.id, opts))
  return (
    <div className="analysis-page">
      <div className="chip-row" role="tablist" aria-label="Región">
        {regions.map((r) => (
          <a key={r.id} role="tab" aria-selected={r.id === region.id} className={r.id === region.id ? 'chip active' : 'chip'} href={buildHash('/analisis', { region: r.id })}>
            {r.name}
          </a>
        ))}
      </div>
      <Panel title={`Métricas topográficas · ${region.name}`} subtitle="Definiciones de docs/science/metrics.md. Escala común prevista: malla MOLA MEGDR (~463 m).">
        <ResourceGate
          resource={metrics}
          notLoaded={
            <>
              <PendingAoiNotice region={region} />
              <MetricsGrid body={null} />
            </>
          }
        >
          {(body) => <MetricsGrid body={body} />}
        </ResourceGate>
      </Panel>
      <div className="two-col">
        {QUALITY_INDICATORS.map((q) => (
          <Panel key={q.id} title={q.name}>
            <p>{q.description}</p>
            <dl className="fields compact">
              <Field label="Unidad">{q.unit}</Field>
              {q.id === 'dem_quality' && <Field label="Resolución nominal">{formatResolution(region.dataset)}</Field>}
              <Field label="Estado">
                <StatusBadge tone={datasetVerification(region.dataset).tone}>{datasetVerification(region.dataset).label}</StatusBadge>
              </Field>
            </dl>
            <ChartPlaceholder chart={q.plannedChart} />
          </Panel>
        ))}
      </div>
    </div>
  )
}
