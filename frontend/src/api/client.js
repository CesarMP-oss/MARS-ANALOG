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

export const getHealth = (options) => apiGet('/health', options)
export const getLimitations = (options) => apiGet('/limitations', options)
