// Static catalogue of the fixed regions approved for the MVP. It only holds identifiers,
// general descriptions and cited location references for navigation. Analysis boundaries
// (AOIs) are versioned in data/aoi/ and served by GET /api/v1/regions once defined (milestone 1).

export const BODY_LABELS = { earth: 'Tierra', mars: 'Marte' }

export const REGION_CATALOG = [
  {
    id: 'jezero',
    name: 'Cráter Jezero',
    body: 'mars',
    role: 'reference',
    location: 'Borde occidental de Isidis Planitia, Marte',
    description:
      'Cráter de impacto donde aterrizó el rover Perseverance (Mars 2020) en 2021. Conserva un antiguo depósito deltaico. Es la región de referencia del ACI 0.1.',
    datasetId: 'mola_megdr_128',
    reference: {
      kind: 'feature_center',
      label: 'Centro del cráter',
      lat: 18.41,
      lon: 77.69,
      diameterKm: 47.52,
      source: 'USGS Gazetteer of Planetary Nomenclature',
      sourceUrl: 'https://planetarynames.wr.usgs.gov/',
    },
  },
  {
    id: 'uyuni',
    name: 'Salar de Uyuni',
    body: 'earth',
    role: 'candidate',
    location: 'Departamento de Potosí, Bolivia',
    description:
      'El salar más extenso del mundo, en el Altiplano del suroeste de Bolivia. Su superficie es extremadamente plana, por lo que la pendiente y la curvatura pueden quedar dominadas por el ruido del DEM.',
    datasetId: 'srtmgl1_v003',
    reference: {
      kind: 'general',
      label: 'Punto de referencia general del salar',
      lat: -20.33333,
      lon: -67.7,
      source: 'Wikipedia (es), «Salar de Uyuni»',
      sourceUrl: 'https://es.wikipedia.org/wiki/Salar_de_Uyuni',
    },
  },
  {
    id: 'sajama',
    name: 'Sajama',
    body: 'earth',
    role: 'candidate',
    location: 'Departamento de Oruro, Bolivia',
    description:
      'Estratovolcán y montaña más alta de Bolivia, dentro del Parque Nacional Sajama, en el Altiplano occidental.',
    datasetId: 'srtmgl1_v003',
    reference: {
      kind: 'summit',
      label: 'Cumbre del Nevado Sajama',
      lat: -18.10806,
      lon: -68.88306,
      source: 'Wikipedia (es), «Nevado Sajama»',
      sourceUrl: 'https://es.wikipedia.org/wiki/Nevado_Sajama',
    },
  },
  {
    id: 'altiplano',
    name: 'Altiplano boliviano',
    body: 'earth',
    role: 'candidate',
    location: 'Altiplano andino, Bolivia',
    description:
      'Meseta andina de gran altitud compartida por Bolivia, Perú, Chile y Argentina. La región representativa que se analizará todavía no está definida.',
    datasetId: 'srtmgl1_v003',
    reference: null,
  },
  {
    id: 'atacama',
    name: 'Desierto de Atacama',
    body: 'earth',
    role: 'candidate',
    location: 'Norte de Chile',
    description:
      'Uno de los desiertos no polares más áridos de la Tierra. La región representativa que se analizará todavía no está definida.',
    datasetId: 'srtmgl1_v003',
    reference: {
      kind: 'general',
      label: 'Punto de referencia general del desierto',
      lat: -24.5,
      lon: -69.25,
      source: 'Wikipedia (es), «Desierto de Atacama»',
      sourceUrl: 'https://es.wikipedia.org/wiki/Desierto_de_Atacama',
    },
  },
]

export const REFERENCE_REGION_ID = 'jezero'

export function findCatalogRegion(id) {
  return REGION_CATALOG.find((region) => region.id === id) ?? null
}
