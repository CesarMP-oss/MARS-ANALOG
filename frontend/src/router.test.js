import { describe, expect, it } from 'vitest'
import { ROUTES, buildHash, parseHash } from './router.js'

describe('hash router', () => {
  it('parses paths, params and queries', () => {
    expect(parseHash('')).toEqual({ path: '/', params: [], query: {} })
    expect(parseHash('#/regiones/uyuni?cuerpo=earth')).toEqual({
      path: '/regiones',
      params: ['uyuni'],
      query: { cuerpo: 'earth' },
    })
  })

  it('builds hashes without empty query values', () => {
    expect(buildHash('/comparador', { a: 'uyuni', b: 'jezero', c: null })).toBe('#/comparador?a=uyuni&b=jezero')
    expect(buildHash('/aci')).toBe('#/aci')
  })

  it('exposes the six required sections', () => {
    expect(ROUTES.map((r) => r.path)).toEqual(['/', '/regiones', '/mapas', '/comparador', '/analisis', '/aci'])
  })
})
