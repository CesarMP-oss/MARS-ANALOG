// Client for the MARS-ANALOG read-only API (contract: docs/api/contract.md).

export const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function isEnvelope(body) {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    body.meta !== null &&
    typeof body.meta === 'object' &&
    Array.isArray(body.limitations) &&
    Array.isArray(body.provenance_ids)
  )
}

export async function apiGet(path, { fetchImpl = globalThis.fetch, signal } = {}) {
  let response
  try {
    response = await fetchImpl(`${API_PREFIX}${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError(0, 'network_error', 'No se pudo conectar con la API', { cause: String(cause) })
  }

  let body
  try {
    body = await response.json()
  } catch {
    if (!response.ok) {
      // A dev proxy or gateway answers without JSON when FastAPI is unreachable.
      throw new ApiError(
        response.status,
        'backend_unavailable',
        `No se pudo conectar con el backend (HTTP ${response.status})`,
      )
    }
    throw new ApiError(response.status, 'invalid_json', 'La API no devolvió JSON válido')
  }

  if (!response.ok) {
    const error = body?.error ?? {}
    throw new ApiError(
      response.status,
      error.code ?? 'http_error',
      error.message ?? `HTTP ${response.status}`,
      error.details ?? {},
    )
  }
  if (!isEnvelope(body)) {
    throw new ApiError(response.status, 'invalid_envelope', 'Respuesta fuera del contrato de la API')
  }
  return body
}

// A metric or ACI result only carries values when it has actually been computed.
export function hasValues(result) {
  return result?.status === 'ok' || result?.status === 'below_noise_floor'
}

const id = (value) => encodeURIComponent(value)

export const getHealth = (options) => apiGet('/health', options)
export const getLimitations = (options) => apiGet('/limitations', options)
export const getDatasets = (options) => apiGet('/datasets', options)
export const getRegions = (options) => apiGet('/regions', options)
export const getRegionMetrics = (regionId, options) => apiGet(`/regions/${id(regionId)}/metrics`, options)
export const getComparisons = (referenceId, options) =>
  apiGet(`/comparisons?reference=${id(referenceId)}`, options)
export const getComparison = (referenceId, candidateId, options) =>
  apiGet(`/comparisons/${id(referenceId)}/${id(candidateId)}`, options)

// The requested region or reference has no AOI loaded in the API yet (expected before milestone 1).
export function isNotLoaded(error) {
  return error?.status === 404 && error?.code === 'region_not_found'
}
