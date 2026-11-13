import { useMemo } from 'react'
import { RegionDetail } from '../components/science.jsx'
import { EmptyState, Panel, StatusBadge } from '../components/ui.jsx'
import { BODY_CRS } from '../map/crs.js'
import PlanetMap from '../map/PlanetMap.jsx'
import { buildHash, navigate } from '../router.js'
import { useRegions } from '../state/context.js'

const TABS = [
  { slug: 'tierra', body: 'earth', label: 'Tierra', crs: `${BODY_CRS.earth} · WGS84` },
  { slug: 'marte', body: 'mars', label: 'Marte', crs: `${BODY_CRS.mars} · planetocéntrica, longitud este` },
]

export default function MapPage({ route }) {
  const regions = useRegions()
  const tab = TABS.find((t) => t.slug === route.params[0]) ?? TABS[0]
  const bodyRegions = useMemo(() => regions.filter((r) => r.body === tab.body), [regions, tab.body])
  const selected = bodyRegions.find((r) => r.id === route.query.region) ?? bodyRegions.find((r) => r.reference) ?? null
  const unplaced = bodyRegions.filter((r) => !r.reference)
  return (
    <div className="map-page">
      <div className="map-toolbar">
        <div className="segmented" role="tablist" aria-label="Planeta">
          {TABS.map((t) => (
            <a key={t.slug} role="tab" aria-selected={t.slug === tab.slug} className={t.slug === tab.slug ? 'segment active' : 'segment'} href={buildHash(`/mapas/${t.slug}`)}>
              {t.label}
            </a>
          ))}
        </div>
        <StatusBadge tone="accent">CRS: {tab.crs}</StatusBadge>
      </div>
      <div className="map-layout">
        <Panel className="map-panel">
          <PlanetMap
            key={tab.body}
            body={tab.body}
            regions={bodyRegions}
            selectedId={selected?.id}
            onSelect={(id) => navigate(`/mapas/${tab.slug}`, { region: id })}
          />
        </Panel>
        <div className="stack">
          <Panel title="Región seleccionada">
            {selected ? <RegionDetail region={selected} /> : <EmptyState title="Seleccione un marcador en el mapa" />}
          </Panel>
          {unplaced.length > 0 && (
            <Panel title="Sin ubicación todavía">
              <ul className="plain-list">
                {unplaced.map((r) => (
                  <li key={r.id}>
                    <a href={`#/regiones/${r.id}`}>{r.name}</a>: región representativa por definir.
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="Capas del modelo de elevación">
            <EmptyState title="Capas DEM pendientes">
              <p>
                El relieve sombreado y las métricas por píxel se mostrarán cuando existan rasters procesados (hito 5). El
                mapa base es solo contexto visual; no son los datos analizados.
              </p>
            </EmptyState>
          </Panel>
        </div>
      </div>
    </div>
  )
}
