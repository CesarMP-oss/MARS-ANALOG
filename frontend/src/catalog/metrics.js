// Planned terrain metrics (docs/science/metrics.md). Names and units match the API contract.

export const METRICS = [
  {
    id: 'slope',
    name: 'Pendiente',
    unit: 'grados',
    method: 'Gradiente 3×3 de Horn',
    reference: 'Horn (1981), Proc. IEEE 69(1)',
    description: 'Inclinación local del terreno respecto a la horizontal.',
    plannedChart: 'Histograma de píxeles válidos con percentiles p05–p95',
  },
  {
    id: 'tri_riley',
    name: 'Rugosidad topográfica (TRI)',
    unit: 'm',
    method: 'Raíz de la suma de diferencias cuadradas con los 8 vecinos',
    reference: 'Riley et al. (1999), Intermountain J. Sci. 5',
    description: 'Variación de elevación entre una celda y sus vecinas.',
    plannedChart: 'Histograma y diagrama de caja',
  },
  {
    id: 'local_relief',
    name: 'Relieve local',
    unit: 'm',
    method: 'Máximo − mínimo en un radio fijo',
    reference: 'Radio por fijar antes del hito 3',
    description: 'Amplitud de elevación dentro de una ventana de radio fijo.',
    plannedChart: 'Histograma y diagrama de caja',
  },
  {
    id: 'profile_curvature',
    name: 'Curvatura de perfil',
    unit: '1/m',
    method: 'Polinomio cuadrático 3×3',
    reference: 'Zevenbergen & Thorne (1987), ESPL 12',
    description: 'Curvatura en la dirección de máxima pendiente (aceleración del flujo).',
    plannedChart: 'Histograma centrado en cero',
  },
  {
    id: 'plan_curvature',
    name: 'Curvatura en planta',
    unit: '1/m',
    method: 'Polinomio cuadrático 3×3',
    reference: 'Zevenbergen & Thorne (1987), ESPL 12',
    description: 'Curvatura perpendicular a la pendiente (convergencia o divergencia).',
    plannedChart: 'Histograma centrado en cero',
  },
]

export const QUALITY_INDICATORS = [
  {
    id: 'coverage',
    name: 'Cobertura de datos',
    unit: 'fracción de píxeles válidos',
    description:
      'Proporción de la región con elevación válida. Por debajo del 80 % el resultado se marca como datos insuficientes y no se calcula.',
    plannedChart: 'Barra de cobertura por región y métrica',
  },
  {
    id: 'dem_quality',
    name: 'Calidad y resolución del DEM',
    unit: 'fracción rellenada / interpolada',
    description:
      'Píxeles SRTM rellenados con otras fuentes (SRTMGL1N) y bins MOLA sin disparo láser (archivo de conteos), junto con la resolución nominal y la escala de comparación.',
    plannedChart: 'Mapa de calidad y barras por fuente',
  },
]

export const METRIC_STATUS = {
  ok: { label: 'Calculada', tone: 'ok' },
  below_noise_floor: { label: 'Bajo el piso de ruido', tone: 'warning' },
  insufficient_data: { label: 'Datos insuficientes', tone: 'warning' },
  not_computed: { label: 'No calculada', tone: 'pending' },
}

export function findMetric(id) {
  return METRICS.find((metric) => metric.id === id) ?? null
}
