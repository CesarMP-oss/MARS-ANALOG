import { describe, expect, it } from 'vitest'
import { localizeLimitation } from './limitations.js'
import { METRICS, METRIC_STATUS } from './metrics.js'
import { REGION_CATALOG } from './regions.js'

const API_METRICS = ['slope', 'tri_riley', 'local_relief', 'profile_curvature', 'plan_curvature']
const API_LIMITATIONS = [
  'TOPOGRAPHY_ONLY',
  'ACI_EXPERIMENTAL',
  'SCALE_DEPENDENCE',
  'MOLA_INTERPOLATED_BINS',
  'MEGDR_GDAL_PIXEL_SCALE',
  'SRTM_VOID_FILL',
  'GMTED_SOUTH_AMERICA_SHIFT',
  'DEM_NOISE_FLAT_TERRAIN',
  'DIFFERENT_VERTICAL_REFERENCES',
  'AOI_DEFINITION_DEPENDENCE',
]

describe('region catalogue', () => {
  it('contains exactly the approved MVP regions', () => {
    expect(REGION_CATALOG.map((r) => r.id)).toEqual(['jezero', 'uyuni', 'sajama', 'altiplano', 'atacama'])
    expect(REGION_CATALOG.filter((r) => r.role === 'reference').map((r) => r.id)).toEqual(['jezero'])
  })

  it('uses MOLA MEGDR for Mars and SRTMGL1 for Earth', () => {
    for (const region of REGION_CATALOG) {
      expect(region.datasetId).toBe(region.body === 'mars' ? 'mola_megdr_128' : 'srtmgl1_v003')
    }
  })

  it('cites a source for every location reference and holds no metric values', () => {
    for (const region of REGION_CATALOG) {
      if (region.reference) {
        expect(region.reference.source).toBeTruthy()
        expect(region.reference.sourceUrl).toMatch(/^https:\/\//)
      }
      expect(Object.keys(region)).not.toContain('metrics')
      expect(Object.keys(region)).not.toContain('aci')
    }
    expect(REGION_CATALOG.find((r) => r.id === 'altiplano').reference).toBeNull()
  })
})

describe('metric and limitation catalogues', () => {
  it('match the API contract', () => {
    expect(METRICS.map((m) => m.id)).toEqual(API_METRICS)
    expect(Object.keys(METRIC_STATUS).sort()).toEqual(['below_noise_floor', 'insufficient_data', 'not_computed', 'ok'])
  })

  it('translates every API limitation and keeps unknown ones verbatim', () => {
    for (const code of API_LIMITATIONS) {
      expect(localizeLimitation({ code, title: 'EN', message: 'EN' }).title).not.toBe('EN')
    }
    expect(localizeLimitation({ code: 'NEW', title: 'T', message: 'M' })).toEqual({ code: 'NEW', title: 'T', message: 'M' })
  })
})
