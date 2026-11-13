import { Field, Panel, StatusBadge } from './ui.jsx'

export default function StatusPanel({ health, error }) {
  if (error) {
    return (
      <Panel title="Estado del backend" className="status-panel status-error">
        <StatusBadge tone="error">No disponible</StatusBadge>
        <p>
          {error.message} <code>{error.code}</code>
        </p>
      </Panel>
    )
  }
  if (!health) {
    return (
      <Panel title="Estado del backend" className="status-panel">
        <p>Consultando…</p>
      </Panel>
    )
  }
  const { data, meta } = health
  return (
    <Panel
      title="Estado del backend"
      className="status-panel"
      actions={<StatusBadge tone="ok">En línea</StatusBadge>}
    >
      <dl className="fields">
        <Field label="API / software">
          {data.api_version} / {data.software_version} ({data.git_commit ?? 'sin commit'})
        </Field>
        <Field label="Python">{data.python}</Field>
        <Field label="GDAL">{data.gdal}</Field>
        <Field label="PROJ (rasterio / pyproj)">
          {data.proj_rasterio} / {data.proj_pyproj}
        </Field>
        <Field label="Resultados">{data.results_run_id ?? 'Todavía no hay resultados calculados'}</Field>
      </dl>
      {meta.is_synthetic && <p className="synthetic-warning">Datos sintéticos de prueba</p>}
    </Panel>
  )
}
