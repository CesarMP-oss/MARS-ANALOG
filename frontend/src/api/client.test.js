import { describe, expect, it } from 'vitest'
import { ApiError, apiGet, hasValues } from './client.js'

function fakeFetch(status, body, { json = true } = {}) {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url, init })
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (!json) throw new SyntaxError('not json')
        return body
      },
    }
  }
  impl.calls = calls
  return impl
}

const envelope = {
  api_version: '1.0',
  data: { status: 'ok' },
  meta: { is_synthetic: false },
  limitations: [{ code: 'TOPOGRAPHY_ONLY', severity: 'critical', title: 't', message: 'm' }],
  provenance_ids: [],
}

describe('apiGet', () => {
  it('requests the versioned API path and returns the envelope', async () => {
    const fetchImpl = fakeFetch(200, envelope)
    await expect(apiGet('/health', { fetchImpl })).resolves.toEqual(envelope)
    expect(fetchImpl.calls[0].url).toBe('/api/v1/health')
  })

  it('maps contract errors to ApiError', async () => {
    const fetchImpl = fakeFetch(404, { error: { code: 'region_not_found', message: 'nope' } })
    const error = await apiGet('/regions/x', { fetchImpl }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.code).toBe('region_not_found')
  })

  it('rejects responses outside the envelope contract', async () => {
    const fetchImpl = fakeFetch(200, { data: {} })
    await expect(apiGet('/health', { fetchImpl })).rejects.toMatchObject({ code: 'invalid_envelope' })
  })

  it('reports an unreachable backend, invalid JSON and network failures', async () => {
    await expect(
      apiGet('/health', { fetchImpl: fakeFetch(502, null, { json: false }) }),
    ).rejects.toMatchObject({ code: 'backend_unavailable', status: 502 })
    await expect(
      apiGet('/health', { fetchImpl: fakeFetch(200, null, { json: false }) }),
    ).rejects.toMatchObject({ code: 'invalid_json', status: 200 })
    const failing = async () => {
      throw new TypeError('Failed to fetch')
    }
    await expect(apiGet('/health', { fetchImpl: failing })).rejects.toMatchObject({
      code: 'network_error',
    })
  })
})

describe('hasValues', () => {
  it('only treats computed results as carrying values', () => {
    expect(hasValues({ status: 'ok' })).toBe(true)
    expect(hasValues({ status: 'below_noise_floor' })).toBe(true)
    expect(hasValues({ status: 'not_computed' })).toBe(false)
    expect(hasValues({ status: 'insufficient_data' })).toBe(false)
    expect(hasValues(undefined)).toBe(false)
  })
})
