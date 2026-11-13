export default function StatusPanel({ health, error }) {
  if (error) {
    return (
      <section className="status-panel status-error">
        <h2>Estado del backend</h2>
        <p>
          No disponible ({error.code}): {error.message}
        </p>
      </section>
    )
  }
  if (!health) {
    return (
      <section className="status-panel">
        <h2>Estado del backend</h2>
        <p>Consultando…</p>
      </section>
    )
  }
  const { data, meta } = health
  return (
    <section className="status-panel">
      <h2>Estado del backend</h2>
      <dl>
        <dt>Estado</dt>
        <dd>{data.status}</dd>
        <dt>API / software</dt>
        <dd>
          {data.api_version} / {data.software_version} ({data.git_commit ?? 'sin commit'})
        </dd>
        <dt>Python</dt>
        <dd>{data.python}</dd>
        <dt>GDAL</dt>
        <dd>{data.gdal}</dd>
        <dt>PROJ (rasterio / pyproj)</dt>
        <dd>
          {data.proj_rasterio} / {data.proj_pyproj}
        </dd>
        <dt>Resultados</dt>
        <dd>{data.results_run_id ?? 'Todavía no hay resultados calculados'}</dd>
      </dl>
      {meta.is_synthetic && <p className="synthetic-warning">Datos sintéticos de prueba</p>}
    </section>
  )
}
