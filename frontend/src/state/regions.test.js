import { describe, expect, it } from 'vitest'
import { datasets, failure, noRegions, success } from '../test/fixtures.js'
import { aoiStatus, datasetVerification, formatResolution, mergeRegions } from './regions.js'

describe('mergeRegions', () => {
  it('joins the catalogue with manifest datasets while no AOI exists', () => {
    const merged = mergeRegions(success(datasets), success(noRegions))
    expect(merged).toHaveLength(5)
    expect(merged.every((r) => r.apiRegion === null)).toBe(true)
    expect(merged.find((r) => r.id === 'jezero').dataset.product_id).toBe('MGS-M-MOLA-5-MEGDR-L3-V1.0')
    expect(aoiStatus(merged[0]).tone).toBe('pending')
  })

  it('keeps working when the API is unavailable', () => {
    const merged = mergeRegions(failure({ code: 'network_error' }), failure({ code: 'network_error' }))
    expect(merged).toHaveLength(5)
    expect(merged[0].dataset).toBeNull()
    expect(datasetVerification(merged[0].dataset).tone).toBe('unknown')
    expect(formatResolution(null)).toBe('No disponible')
  })

  it('uses AOIs served by the API, including regions outside the catalogue', () => {
    // SYNTHETIC region features, test-only.
    const feature = (id, name) => ({
      type: 'Feature',
      id,
      geometry: { type: 'Polygon', coordinates: [] },
      properties: { name, body: 'earth', crs: 'EPSG:4326', role: 'candidate', dataset_id: 'srtmgl1_v003', aoi_version: '1', boundary_source: 'test', rationale: 'test', is_synthetic: true },
    })
    const regions = success({ data: [feature('uyuni', 'Uyuni'), feature('extra', 'Extra')] })
    const merged = mergeRegions(success(datasets), regions)
    expect(aoiStatus(merged.find((r) => r.id === 'uyuni'))).toEqual({ tone: 'ok', label: 'AOI 1 definido' })
    expect(merged.at(-1).id).toBe('extra')
  })
})

describe('dataset verification', () => {
  it('is pending until every file has a SHA-256', () => {
    expect(datasetVerification(datasets.data[0]).tone).toBe('pending')
    expect(datasetVerification(datasets.data[1]).label).toMatch(/SHA-256 pendiente/)
    const verified = { ...datasets.data[1], files: [{ name: 'x', sha256: 'a'.repeat(64) }] }
    expect(datasetVerification(verified).tone).toBe('ok')
    expect(formatResolution(datasets.data[1])).toBe('463,058 m (nominal)')
  })
})
