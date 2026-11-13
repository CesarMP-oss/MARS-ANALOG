import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { METRICS } from '../catalog/metrics.js'
import { syntheticAci, syntheticSlope } from '../test/fixtures.js'
import { AciResultView, MetricCard, ResourceGate } from './science.jsx'

const slope = METRICS[0]

describe('MetricCard', () => {
  it('shows the planned chart and status when not computed', () => {
    const html = renderToStaticMarkup(<MetricCard metric={slope} summary={null} />)
    expect(html).toContain('No calculada')
    expect(html).toContain('Gráfico previsto')
    expect(html).not.toContain('Mediana')
  })

  it('renders values only for computed summaries (synthetic test data)', () => {
    const html = renderToStaticMarkup(<MetricCard metric={slope} summary={syntheticSlope} />)
    expect(html).toContain('Calculada')
    expect(html).toContain('Mediana')
    expect(html).not.toContain('Gráfico previsto')
  })
})

describe('AciResultView', () => {
  it('shows no score for not_computed results', () => {
    const result = { ...syntheticAci, status: 'not_computed', score: null, components: [] }
    const html = renderToStaticMarkup(<AciResultView result={result} />)
    expect(html).toContain('ACI no calculado')
    expect(html).not.toContain('aci-score-value')
  })

  it('shows the per-metric breakdown and disclaimer when computed (synthetic test data)', () => {
    const html = renderToStaticMarkup(<AciResultView result={syntheticAci} />)
    expect(html).toContain('aci-score-value')
    expect(html).toContain('Pendiente')
    expect(html).toContain('Topographic similarity only.')
  })
})

describe('ResourceGate', () => {
  const child = () => <p>datos</p>
  it('distinguishes loading, missing AOI and real errors', () => {
    const gate = (resource) =>
      renderToStaticMarkup(
        <ResourceGate resource={resource} notLoaded={<p>sin AOI</p>}>
          {child}
        </ResourceGate>,
      )
    expect(gate({ status: 'loading' })).toContain('Cargando')
    expect(gate({ status: 'error', error: { status: 404, code: 'region_not_found' } })).toContain('sin AOI')
    expect(gate({ status: 'error', error: { status: 500, code: 'results_store_invalid', message: 'x' } })).toContain(
      'results_store_invalid',
    )
    expect(gate({ status: 'success', body: {} })).toContain('datos')
  })
})
