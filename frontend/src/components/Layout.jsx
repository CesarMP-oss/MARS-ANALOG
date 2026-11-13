import { ROUTES } from '../router.js'
import Icon from './Icon.jsx'
import LimitationsBanner from './LimitationsBanner.jsx'
import { StatusBadge } from './ui.jsx'

export function Logo() {
  return (
    <a className="logo" href="#/" aria-label="MARS-ANALOG, inicio">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <circle cx="20" cy="20" r="9" className="logo-planet" />
        <ellipse cx="20" cy="20" rx="17" ry="6.5" className="logo-orbit" transform="rotate(-20 20 20)" />
        <circle cx="34.5" cy="13.5" r="2.2" className="logo-moon" />
      </svg>
      <span>
        MARS<span className="logo-accent">-ANALOG</span>
      </span>
    </a>
  )
}

function BackendPill({ health }) {
  if (health.status === 'success') return <StatusBadge tone="ok">API en línea</StatusBadge>
  if (health.status === 'error') return <StatusBadge tone="error">API no disponible</StatusBadge>
  return <StatusBadge tone="pending">Conectando…</StatusBadge>
}

export default function Layout({ route, health, limitations, children }) {
  const current = ROUTES.find((item) => item.path === route.path) ?? ROUTES[0]
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Secciones">
        <Logo />
        <ul className="nav-list">
          {ROUTES.map((item) => (
            <li key={item.path}>
              <a
                href={`#${item.path}`}
                className={item.path === current.path ? 'nav-link active' : 'nav-link'}
                aria-current={item.path === current.path ? 'page' : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="sidebar-foot">
          NASA Space Apps Challenge 2026
          <br />
          Prototipo científico · v0.1
        </p>
      </nav>
      <div className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Similitud topográfica experimental</p>
            <h1 className="page-title">{current.label}</h1>
          </div>
          <BackendPill health={health} />
        </header>
        <LimitationsBanner limitations={limitations} />
        <main className="page" key={current.path}>
          {children}
        </main>
      </div>
    </div>
  )
}
