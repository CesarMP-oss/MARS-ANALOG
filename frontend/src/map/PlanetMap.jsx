import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { BASEMAPS, MARS_RADIUS_KM, circleRing, createMarsCrs } from './crs.js'

const EARTH_VIEW = { center: [-20.5, -68.2], zoom: 6 }
const MARS_VIEW = { center: [18.41, 77.69], zoom: 5 }

// One independent Leaflet map per body. Leaflet is loaded lazily so the module can be imported
// (and tested) without a DOM. Markers are cited reference points, never AOIs.
export default function PlanetMap({ body, regions, selectedId, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(new Map())
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    let cancelled = false
    import('leaflet')
      .then(({ default: L }) => {
        if (cancelled || !containerRef.current) return
        const isMars = body === 'mars'
        const view = isMars ? MARS_VIEW : EARTH_VIEW
        const map = L.map(containerRef.current, {
          crs: isMars ? createMarsCrs(L) : L.CRS.EPSG3857,
          center: view.center,
          zoom: view.zoom,
          minZoom: isMars ? 1 : 2,
          maxZoom: isMars ? 9 : 14,
          maxBounds: isMars ? [[-90, -180], [90, 180]] : undefined,
          worldCopyJump: !isMars,
          attributionControl: true,
        })
        const basemap = BASEMAPS[body]
        L.tileLayer(basemap.url, {
          attribution: basemap.attribution,
          maxNativeZoom: basemap.maxNativeZoom,
          noWrap: isMars,
          bounds: isMars ? [[-90, -180], [90, 180]] : undefined,
        }).addTo(map)
        L.control.scale({ imperial: false }).addTo(map)

        for (const region of regions) {
          const ref = region.reference
          if (!ref) continue
          const group = L.featureGroup().addTo(map)
          if (ref.diameterKm) {
            const radius = isMars ? MARS_RADIUS_KM : 6371.0088
            L.polygon(circleRing(ref.lat, ref.lon, ref.diameterKm / 2, radius), {
              className: 'map-ring',
              interactive: false,
            }).addTo(group)
          }
          L.circleMarker([ref.lat, ref.lon], {
            radius: 8,
            className: ref.kind === 'general' ? 'map-marker map-marker-general' : 'map-marker',
          })
            .bindTooltip(region.name, { direction: 'top', offset: [0, -8] })
            .on('click', () => onSelectRef.current?.(region.id))
            .addTo(group)
          layersRef.current.set(region.id, group)
        }
        mapRef.current = map
        setReady(true)
      })
      .catch(() => setFailed(true))
    const layers = layersRef.current
    return () => {
      cancelled = true
      setReady(false)
      mapRef.current?.remove()
      mapRef.current = null
      layers.clear()
    }
  }, [body, regions])

  useEffect(() => {
    if (!ready) return
    for (const [id, group] of layersRef.current) {
      group.eachLayer((layer) => {
        const el = layer.getElement?.()
        if (el) el.classList.toggle('is-selected', id === selectedId)
      })
    }
    const group = layersRef.current.get(selectedId)
    if (group) mapRef.current.flyTo(group.getBounds().getCenter(), mapRef.current.getZoom(), { duration: 0.6 })
  }, [ready, selectedId])

  return (
    <div className="planet-map-wrap">
      <div ref={containerRef} className={`planet-map planet-map-${body}`} data-crs={body} />
      {failed && <p className="map-error">No se pudo cargar el mapa.</p>}
      <p className="map-caption">{BASEMAPS[body].label}</p>
    </div>
  )
}
