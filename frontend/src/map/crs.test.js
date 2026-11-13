import { describe, expect, it } from 'vitest'
import {
  BODY_CRS,
  MARS_RADIUS_KM,
  circleRing,
  createMarsCrs,
  formatLatLon,
  marsDistanceMeters,
  marsLonLatToPixel,
  marsTileForLonLat,
  normalizeLon180,
} from './crs.js'

const JEZERO = { lat: 18.41, lon: 77.69 }

describe('Mars map coordinates', () => {
  it('uses the IAU 2015 Mars CRS, never an Earth CRS', () => {
    expect(BODY_CRS.mars).toBe('IAU_2015:49900')
    expect(BODY_CRS.earth).toBe('EPSG:4326')
  })

  it('places Jezero on the expected equirectangular pixel and Mars Trek tile', () => {
    // 256 px span 180 degrees at zoom 0; origin at (-180 E, 90 N).
    const p = marsLonLatToPixel(JEZERO.lon, JEZERO.lat, 0)
    expect(p.x).toBeCloseTo(((77.69 + 180) * 256) / 180, 6)
    expect(p.y).toBeCloseTo(((90 - 18.41) * 256) / 180, 6)
    expect(marsLonLatToPixel(-180, 90, 3)).toEqual({ x: 0, y: 0 })
    expect(marsLonLatToPixel(180, -90, 0)).toEqual({ x: 512, y: 256 })
    expect(marsTileForLonLat(JEZERO.lon, JEZERO.lat, 0)).toEqual({ col: 1, row: 0 })
    expect(marsTileForLonLat(JEZERO.lon, JEZERO.lat, 7)).toEqual({ col: 183, row: 50 })
  })

  it('converts MOLA 0..360 east longitudes to -180..180', () => {
    expect(normalizeLon180(77.69)).toBeCloseTo(77.69)
    expect(normalizeLon180(270)).toBe(-90)
    expect(normalizeLon180(-190)).toBe(170)
    expect(normalizeLon180(180)).toBe(180)
  })

  it('measures distances on the Mars sphere, not on Earth', () => {
    const oneDegree = marsDistanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
    expect(oneDegree).toBeCloseTo((2 * Math.PI * MARS_RADIUS_KM * 1000) / 360, 0)
  })

  it('draws the Jezero rim ring at the published radius', () => {
    const ring = circleRing(JEZERO.lat, JEZERO.lon, 47.52 / 2, MARS_RADIUS_KM)
    for (const [lat, lon] of ring) {
      const d = marsDistanceMeters({ lat: JEZERO.lat, lng: JEZERO.lon }, { lat, lng: lon })
      expect(d / 1000).toBeCloseTo(23.76, 3)
    }
  })

  it('builds a Leaflet CRS with the planetary transformation and distance', () => {
    class Transformation {
      constructor(...args) {
        this.args = args
      }
    }
    const fakeL = {
      extend: (target, ...sources) => Object.assign(target, ...sources),
      CRS: { Simple: { code: 'SIMPLE', infinite: true } },
      Projection: { LonLat: 'lonlat' },
      Transformation,
    }
    const crs = createMarsCrs(fakeL)
    expect(crs.code).toBe('IAU_2015:49900')
    expect(crs.code).not.toMatch(/EPSG/)
    expect(crs.projection).toBe('lonlat')
    expect(crs.transformation.args).toEqual([256 / 180, 256, -256 / 180, 128])
    expect(crs.distance).toBe(marsDistanceMeters)
  })

  it('formats coordinates with hemisphere letters', () => {
    expect(formatLatLon(-20.33333, -67.7)).toBe('20,333° S, 67,7° O')
    expect(formatLatLon(18.41, 77.69)).toBe('18,41° N, 77,69° E')
  })
})
