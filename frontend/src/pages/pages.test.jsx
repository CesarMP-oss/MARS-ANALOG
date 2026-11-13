import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Shell } from '../App.jsx'
import { parseHash } from '../router.js'
import { AppDataContext } from '../state/context.js'
import { appData, failure } from '../test/fixtures.js'

const render = (hash, data = appData) =>
  renderToStaticMarkup(
    <AppDataContext.Provider value={data}>
      <Shell route={parseHash(hash)} />
    </AppDataContext.Provider>,
  )

describe('platform pages', () => {
  it.each([
    ['#/', 'Análogos terrestres de'],
    ['#/regiones/uyuni', 'Ficha de la región'],
    ['#/mapas/tierra', 'EPSG:4326'],
    ['#/mapas/marte', 'IAU_2015:49900'],
    ['#/comparador?a=sajama&b=jezero', 'Región A'],
    ['#/analisis?region=uyuni', 'Métricas topográficas · Salar de Uyuni'],
    ['#/aci', 'Un índice explicable de similitud topográfica'],
  ])('%s renders with navigation and the limitations banner', (hash, text) => {
    const html = render(hash)
    expect(html).toContain(text)
    expect(html).toContain('aria-label="Limitaciones científicas"')
    expect(html).toContain('Solo similitud topográfica')
    for (const label of ['Dashboard', 'Regiones', 'Mapas', 'Comparador', 'Análisis', 'Índice ACI']) {
      expect(html).toContain(label)
    }
  })

  it('never shows ACI scores or metric values without computed results', () => {
    for (const hash of ['#/', '#/comparador', '#/analisis', '#/aci', '#/regiones/jezero']) {
      const html = render(hash)
      expect(html).not.toContain('aci-score-value')
      expect(html).not.toContain('Mediana')
    }
    expect(render('#/aci')).toContain('Algoritmo pendiente de implementación y validación')
  })

  it('shows region facts only from the catalogue and manifest', () => {
    const html = render('#/regiones/jezero')
    expect(html).toContain('18,41° N, 77,69° E')
    expect(html).toContain('USGS Gazetteer of Planetary Nomenclature')
    expect(html).toContain('463,058 m (nominal)')
    expect(html).toContain('Sin descargar ni verificar (SHA-256 pendiente)')
    expect(render('#/regiones/altiplano')).toContain('Región representativa por definir')
  })

  it('keeps Mars regions off the Earth map and vice versa', () => {
    expect(render('#/mapas/marte?region=jezero')).toContain('data-crs="mars"')
    const earth = render('#/mapas/tierra')
    expect(earth).toContain('data-crs="earth"')
    expect(earth).toContain('Salar de Uyuni')
    expect(earth).not.toContain('Borde occidental de Isidis Planitia')
  })

  it('explains that two Earth regions have no ACI', () => {
    expect(render('#/comparador?a=uyuni&b=sajama')).toContain('Sin ACI para este par')
  })

  it('stays usable when the backend is down', () => {
    const down = failure({ status: 502, code: 'backend_unavailable', message: 'No se pudo conectar con el backend (HTTP 502)' })
    const html = render('#/', { health: down, limitations: down, datasets: down, regions: down })
    expect(html).toContain('API no disponible')
    expect(html).toContain('backend_unavailable')
    expect(html).toContain('no evalúa habitabilidad')
  })
})
