// Small presentational building blocks shared by every page.

export function Panel({ title, subtitle, actions, className = '', children }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || actions) && (
        <header className="panel-header">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatusBadge({ tone = 'pending', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function BodyBadge({ body }) {
  return <span className={`badge body-${body}`}>{body === 'mars' ? 'Marte' : 'Tierra'}</span>
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-icon" aria-hidden="true">◌</span>
      <p className="empty-title">{title}</p>
      {children && <div className="empty-body">{children}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorState({ error, title = 'No se pudo consultar la API' }) {
  return (
    <div className="error-state" role="alert">
      <p className="empty-title">{title}</p>
      <p>
        {error?.message ?? 'Error desconocido'} <code>{error?.code ?? 'error'}</code>
      </p>
    </div>
  )
}

// Reserved space for a future chart. Draws only empty axes so it cannot be mistaken for data.
export function ChartPlaceholder({ title, chart, reason = 'Sin resultados calculados todavía' }) {
  return (
    <figure className="chart-placeholder" aria-label={`Gráfico previsto: ${chart}`}>
      <svg viewBox="0 0 200 90" aria-hidden="true" className="chart-axes">
        <line x1="20" y1="8" x2="20" y2="78" />
        <line x1="20" y1="78" x2="194" y2="78" />
      </svg>
      <figcaption>
        {title && <strong>{title}</strong>}
        <span>{chart}</span>
        <span className="chart-reason">{reason}</span>
      </figcaption>
    </figure>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
