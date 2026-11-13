import { REGION_CATALOG } from '../catalog/regions.js'

// Catalogue entries joined with what the API actually serves: the manifest dataset and,
// once defined, the versioned AOI. API regions outside the catalogue are listed as well.
export function mergeRegions(datasetsResource, regionsResource) {
  const datasets = datasetsResource.body?.data ?? []
  const apiRegions = regionsResource.body?.data ?? []
  const findDataset = (id) => datasets.find((dataset) => dataset.id === id) ?? null
  const merged = REGION_CATALOG.map((entry) => {
    const apiRegion = apiRegions.find((region) => region.id === entry.id) ?? null
    const datasetId = apiRegion?.properties.dataset_id ?? entry.datasetId
    return { ...entry, datasetId, apiRegion, dataset: findDataset(datasetId) }
  })
  for (const apiRegion of apiRegions) {
    if (merged.some((entry) => entry.id === apiRegion.id)) continue
    const { properties } = apiRegion
    merged.push({
      id: apiRegion.id,
      name: properties.name,
      body: properties.body,
      role: properties.role,
      location: properties.boundary_source,
      description: properties.rationale,
      datasetId: properties.dataset_id,
      reference: null,
      apiRegion,
      dataset: findDataset(properties.dataset_id),
    })
  }
  return merged
}

export function datasetVerification(dataset) {
  if (!dataset) return { tone: 'unknown', label: 'Dataset no disponible en el manifest' }
  const files = dataset.files ?? []
  if (files.length === 0) return { tone: 'pending', label: 'Teselas por seleccionar y verificar (hito 1)' }
  if (files.every((file) => file.sha256)) return { tone: 'ok', label: 'Checksums SHA-256 registrados' }
  return { tone: 'pending', label: 'Sin descargar ni verificar (SHA-256 pendiente)' }
}

export function aoiStatus(region) {
  if (region.apiRegion) {
    return { tone: 'ok', label: `AOI ${region.apiRegion.properties.aoi_version} definido` }
  }
  return { tone: 'pending', label: 'AOI de análisis pendiente (hito 1)' }
}

export function formatResolution(dataset) {
  if (!dataset) return 'No disponible'
  const value = dataset.nominal_resolution_m.toLocaleString('es', { maximumFractionDigits: 3 })
  return `${value} m (nominal)`
}

export function metricFrom(body, metricId) {
  return body?.data?.metrics?.find((item) => item.metric === metricId) ?? null
}
