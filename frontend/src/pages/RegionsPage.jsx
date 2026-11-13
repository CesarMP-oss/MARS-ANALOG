import { getRegionMetrics } from '../api/client.js'
import { useApiResource } from '../api/useApiResource.js'
import { RegionDetail } from '../components/science.jsx'
import { BodyBadge, Panel } from '../components/ui.jsx'
import { buildHash } from '../router.js'
import { useRegions } from '../state/context.js'

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'earth', label: 'Tierra' },
  { id: 'mars', label: 'Marte' },
]

export default function RegionsPage({ route }) {
  const regions = useRegions()
  const filter = route.query.cuerpo ?? 'all'
  const visible = regions.filter((r) => filter === 'all' || r.body === filter)
  const selected = regions.find((r) => r.id === route.params[0]) ?? visible[0] ?? regions[0]
  const metrics = useApiResource(selected ? `metrics:${selected.id}` : null, (opts) =>
    getRegionMetrics(selected.id, opts),
  )
  return (
    <div className="master-detail">
      <Panel title="Regiones" className="master">
        <div className="segmented" role="tablist" aria-label="Filtrar por planeta">
          {FILTERS.map((f) => (
            <a
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={filter === f.id ? 'segment active' : 'segment'}
              href={buildHash(`/regiones${selected ? `/${selected.id}` : ''}`, { cuerpo: f.id === 'all' ? null : f.id })}
            >
              {f.label}
            </a>
          ))}
        </div>
        <ul className="region-list">
          {visible.map((r) => (
            <li key={r.id}>
              <a
                href={buildHash(`/regiones/${r.id}`, { cuerpo: filter === 'all' ? null : filter })}
                className={r.id === selected?.id ? 'region-row active' : 'region-row'}
              >
                <span className="region-row-name">{r.name}</span>
                <BodyBadge body={r.body} />
              </a>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="detail" title="Ficha de la región">
        {selected && <RegionDetail region={selected} metricsResource={metrics} />}
        {selected && (
          <div className="detail-actions">
            <a className="button" href={buildHash(`/mapas/${selected.body === 'mars' ? 'marte' : 'tierra'}`, { region: selected.id })}>
              Ver en el mapa
            </a>
            <a className="button ghost" href={buildHash('/analisis', { region: selected.id })}>
              Métricas
            </a>
          </div>
        )}
      </Panel>
    </div>
  )
}
