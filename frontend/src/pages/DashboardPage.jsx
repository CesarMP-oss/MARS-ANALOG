import { Panel, StatusBadge, BodyBadge } from '../components/ui.jsx'
import StatusPanel from '../components/StatusPanel.jsx'
import { useAppData, useRegions } from '../state/context.js'
import { aoiStatus, datasetVerification, formatResolution } from '../state/regions.js'

const SECTIONS = [
  { href: '#/regiones', title: 'Explorador de regiones', text: 'Fichas de Jezero, Uyuni, Sajama, el Altiplano y Atacama con su DEM y estado de datos.' },
  { href: '#/mapas', title: 'Mapas interactivos', text: 'Mapas independientes de la Tierra (WGS84) y de Marte (planetocéntrico IAU 2015).' },
  { href: '#/comparador', title: 'Comparador de terrenos', text: 'Dos regiones lado a lado: elevación, pendiente, TRI, relieve local y curvatura.' },
  { href: '#/analisis', title: 'Análisis científico', text: 'Definición, unidad, método y estado de cada métrica, cobertura y calidad del DEM.' },
  { href: '#/aci', title: 'Índice ACI 0.1', text: 'Concepto, métricas que participan, desglose e incertidumbre del índice experimental.' },
]

export default function DashboardPage() {
  const { health, datasets } = useAppData()
  const regions = useRegions()
  const datasetList = datasets.body?.data ?? []
  const verified = datasetList.filter((d) => datasetVerification(d).tone === 'ok').length
  const runId = health.body?.data.results_run_id ?? null
  return (
    <div className="dashboard">
      <section className="hero">
        <p className="eyebrow">NASA Space Apps Challenge 2026</p>
        <h2 className="hero-title">
          Análogos terrestres de <span className="accent">Marte</span>, medidos con datos reales
        </h2>
        <p className="hero-text">
          MARS-ANALOG compara la topografía de regiones de Bolivia y Chile con el cráter Jezero usando modelos digitales de
          elevación trazables (NASA SRTM y MOLA). Calcula métricas del terreno y un índice experimental de similitud
          topográfica, siempre con su procedencia y sus limitaciones. No evalúa habitabilidad ni idoneidad para una base.
        </p>
        <div className="hero-stats">
          <div><span className="stat-value">{regions.length}</span><span className="stat-label">regiones fijas</span></div>
          <div><span className="stat-value">{datasetList.length || '—'}</span><span className="stat-label">datasets en el manifest</span></div>
          <div><span className="stat-value">{datasets.status === 'success' ? verified : '—'}</span><span className="stat-label">datasets verificados</span></div>
          <div><span className="stat-value">{runId ? 1 : 0}</span><span className="stat-label">ejecuciones publicadas</span></div>
        </div>
      </section>

      <div className="section-grid">
        {SECTIONS.map((s) => (
          <a key={s.href} href={s.href} className="section-card">
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <span className="section-card-cta">Abrir →</span>
          </a>
        ))}
      </div>

      <div className="two-col">
        <Panel title="Regiones disponibles" subtitle="Catálogo del MVP. Los límites de análisis se definen en el hito 1.">
          <ul className="region-list">
            {regions.map((r) => (
              <li key={r.id}>
                <a href={`#/regiones/${r.id}`} className="region-row">
                  <span className="region-row-name">{r.name}</span>
                  <BodyBadge body={r.body} />
                  <StatusBadge tone={aoiStatus(r).tone}>{aoiStatus(r).label}</StatusBadge>
                </a>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="stack">
          <StatusPanel health={health.body} error={health.error} />
          <Panel title="Estado de los datos científicos">
            {datasets.status === 'error' && <p className="muted">Manifest no disponible: {datasets.error.message}</p>}
            <ul className="dataset-list">
              {datasetList.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.product_id}</strong> <BodyBadge body={d.body} />
                    <p className="muted small">{formatResolution(d)}</p>
                  </div>
                  <StatusBadge tone={datasetVerification(d).tone}>{datasetVerification(d).label}</StatusBadge>
                </li>
              ))}
            </ul>
            <p className="muted small">
              Resultados: {runId ?? 'todavía no hay métricas ni ACI calculados.'}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
