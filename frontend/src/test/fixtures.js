// Fixtures for frontend unit tests. Values marked SYNTHETIC are invented for tests only and
// are never shipped or shown as scientific results.

export const health = {
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
  limitations: [],
  provenance_ids: [],
}

// Mirrors the shape of data/manifest.yaml (checksums still null before milestone 1).
export const datasets = {
  data: [
    { id: 'srtmgl1_v003', body: 'earth', name: 'SRTMGL1 V003', product_id: 'SRTMGL1.003', nominal_resolution_m: 30, files: [] },
    {
      id: 'mola_megdr_128',
      body: 'mars',
      name: 'MOLA MEGDR 128 px/deg',
      product_id: 'MGS-M-MOLA-5-MEGDR-L3-V1.0',
      nominal_resolution_m: 463.058,
      files: [{ name: 'megt44n000hb.img', role: 'topography', sha256: null }],
    },
  ],
  meta: {},
  limitations: [],
  provenance_ids: [],
}

export const noRegions = { data: [], meta: {}, limitations: [], provenance_ids: [] }

export const limitations = {
  data: [
    { code: 'TOPOGRAPHY_ONLY', severity: 'critical', title: 'Topographic similarity only', message: 'EN' },
    { code: 'ACI_EXPERIMENTAL', severity: 'critical', title: 'ACI 0.1 is experimental', message: 'EN' },
    { code: 'SCALE_DEPENDENCE', severity: 'warning', title: 'Scale dependence', message: 'EN' },
  ],
  meta: {},
  limitations: [],
  provenance_ids: [],
}

export const success = (body) => ({ status: 'success', body, error: null })
export const failure = (error) => ({ status: 'error', body: null, error })

export const appData = {
  health: success(health),
  limitations: success(limitations),
  datasets: success(datasets),
  regions: success(noRegions),
}

// SYNTHETIC: a computed metric summary, only to test how computed values would render.
export const syntheticSlope = {
  region_id: 'uyuni',
  metric: 'slope',
  unit: 'degree',
  status: 'ok',
  valid_fraction: 0.9,
  summary: { p05: 0.1, p25: 0.2, median: 0.3, p75: 0.4, p95: 0.5, mean: 0.3, std: 0.1, iqr: 0.2 },
  histogram: { bin_edges: [], counts: [] },
}

// SYNTHETIC: a computed ACI result, only to test the rendering path.
export const syntheticAci = {
  aci_version: '0.1-experimental',
  reference_region_id: 'jezero',
  candidate_region_id: 'uyuni',
  status: 'ok',
  score: 0.4242,
  score_interval: { low: 0.3, high: 0.5, level: 0.9 },
  components: [
    { metric: 'slope', unit: 'degree', distance: 1.5, normalized_distance: 0.8, similarity: 0.45, weight: 1, included: true },
  ],
  disclaimer: 'Topographic similarity only.',
}
