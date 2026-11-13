// Map coordinate conventions. Earth uses WGS84 (EPSG:4326) on a Web Mercator basemap.
// Mars uses planetocentric latitude and east-positive longitude (-180..180) on the
// IAU 2015 Mars sphere (IAU_2015:49900), shown in a simple equirectangular grid. Mars
// coordinates are never passed through Leaflet's Earth CRSs.

export const BODY_CRS = { earth: 'EPSG:4326', mars: 'IAU_2015:49900' }

export const MARS_RADIUS_KM = 3396.19 // IAU 2015 mean equatorial radius

// Equirectangular tiling used by NASA Mars Trek (EPSG:104905): at zoom 0 the globe is
// 2 x 1 tiles of 256 px, origin at (-180, 90).
export const MARS_TILE_SIZE = 256
const PX_PER_DEGREE_Z0 = MARS_TILE_SIZE / 180
export const MARS_TRANSFORMATION = [PX_PER_DEGREE_Z0, MARS_TILE_SIZE, -PX_PER_DEGREE_Z0, MARS_TILE_SIZE / 2]

export function normalizeLon180(lon) {
  const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180
  return wrapped === -180 && lon > 0 ? 180 : wrapped
}

export function marsLonLatToPixel(lon, lat, zoom = 0) {
  const [a, b, c, d] = MARS_TRANSFORMATION
  const scale = 2 ** zoom
  return { x: scale * (a * normalizeLon180(lon) + b), y: scale * (c * lat + d) }
}

export function marsTileForLonLat(lon, lat, zoom) {
  const { x, y } = marsLonLatToPixel(lon, lat, zoom)
  return { col: Math.floor(x / MARS_TILE_SIZE), row: Math.floor(y / MARS_TILE_SIZE) }
}

// Ring of points at `radiusKm` from a centre on a sphere (great-circle destination formula).
export function circleRing(lat, lon, radiusKm, sphereRadiusKm, segments = 72) {
  const toRad = Math.PI / 180
  const angular = radiusKm / sphereRadiusKm
  const lat1 = lat * toRad
  const lon1 = lon * toRad
  const ring = []
  for (let i = 0; i < segments; i += 1) {
    const bearing = (2 * Math.PI * i) / segments
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    )
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      )
    ring.push([lat2 / toRad, normalizeLon180(lon2 / toRad)])
  }
  return ring
}

export function formatLatLon(lat, lon) {
  const fmt = (value) => Math.abs(value).toLocaleString('es', { maximumFractionDigits: 3 })
  return `${fmt(lat)}° ${lat >= 0 ? 'N' : 'S'}, ${fmt(lon)}° ${lon >= 0 ? 'E' : 'O'}`
}

// Great-circle distance on the IAU 2015 Mars sphere, in metres (used by the scale bar).
export function marsDistanceMeters(a, b) {
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLon = (b.lng - a.lng) * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * MARS_RADIUS_KM * 1000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Creates the Leaflet CRS for Mars. `L` is passed in so this module stays importable without a DOM.
export function createMarsCrs(L) {
  return L.extend({}, L.CRS.Simple, {
    code: BODY_CRS.mars,
    projection: L.Projection.LonLat,
    transformation: new L.Transformation(...MARS_TRANSFORMATION),
    infinite: false,
    distance: marsDistanceMeters,
  })
}

export const BASEMAPS = {
  earth: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Imágenes &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxNativeZoom: 17,
    label: 'Esri World Imagery (contexto visual)',
  },
  mars: {
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    attribution: 'Relieve MOLA coloreado &copy; NASA/JPL-Caltech, MOLA Science Team &mdash; NASA Mars Trek',
    maxNativeZoom: 7,
    label: 'NASA Mars Trek · MOLA shaded relief 463 m (contexto visual, no son los datos analizados)',
  },
}
