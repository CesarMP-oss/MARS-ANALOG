import Layout from './components/Layout.jsx'
import AciPage from './pages/AciPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MapPage from './pages/MapPage.jsx'
import RegionsPage from './pages/RegionsPage.jsx'
import { useHashRoute } from './router.js'
import { AppDataProvider } from './state/AppDataContext.jsx'
import { useAppData } from './state/context.js'
import './App.css'

const PAGES = {
  '/': DashboardPage,
  '/regiones': RegionsPage,
  '/mapas': MapPage,
  '/comparador': ComparePage,
  '/analisis': AnalysisPage,
  '/aci': AciPage,
}

export function Shell({ route }) {
  const { health, limitations } = useAppData()
  const Page = PAGES[route.path] ?? DashboardPage
  return (
    <Layout route={route} health={health} limitations={limitations.body?.data ?? []}>
      <Page route={route} />
    </Layout>
  )
}

export default function App() {
  const route = useHashRoute()
  return (
    <AppDataProvider>
      <Shell route={route} />
    </AppDataProvider>
  )
}
