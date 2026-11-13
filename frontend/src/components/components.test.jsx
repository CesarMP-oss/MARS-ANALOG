import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LimitationsBanner from './LimitationsBanner.jsx'
import StatusPanel from './StatusPanel.jsx'

describe('LimitationsBanner', () => {
  it('shows critical limitations from the API', () => {
    const html = renderToStaticMarkup(
      <LimitationsBanner
        limitations={[
          { code: 'TOPOGRAPHY_ONLY', severity: 'critical', title: 'Topographic similarity only', message: 'A' },
          { code: 'SCALE_DEPENDENCE', severity: 'warning', title: 'Scale', message: 'B' },
        ]}
      />,
    )
    expect(html).toContain('data-code="TOPOGRAPHY_ONLY"')
    expect(html).not.toContain('SCALE_DEPENDENCE')
  })

  it('never renders without a disclaimer', () => {
    expect(renderToStaticMarkup(<LimitationsBanner />)).toContain('similitud topográfica')
  })
})

describe('StatusPanel', () => {
  const health = {
    data: {
      status: 'ok',
      api_version: '1.0',
      software_version: '0.1.0',
      git_commit: 'abc1234',
      python: '3.12.16',
      gdal: '3.12.2',
      proj_rasterio: '9.8.1',
      proj_pyproj: '9.8.1',
      results_run_id: null,
    },
    meta: { is_synthetic: false },
  }

  it('states that no results exist instead of showing placeholder values', () => {
    const html = renderToStaticMarkup(<StatusPanel health={health} />)
    expect(html).toContain('Todavía no hay resultados calculados')
    expect(html).toContain('3.12.2')
    expect(html).not.toContain('Datos sintéticos')
  })

  it('flags synthetic data and shows errors', () => {
    const synthetic = { ...health, meta: { is_synthetic: true } }
    expect(renderToStaticMarkup(<StatusPanel health={synthetic} />)).toContain('Datos sintéticos')
    const error = { code: 'network_error', message: 'down' }
    expect(renderToStaticMarkup(<StatusPanel error={error} />)).toContain('network_error')
  })
})
