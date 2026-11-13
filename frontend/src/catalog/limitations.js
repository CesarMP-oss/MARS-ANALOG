// Spanish wording for the API limitation catalogue (backend/src/mars_analog/limitations.py).
// The API stays the source of truth for which limitations apply; unknown codes fall back to its text.

const ES = {
  TOPOGRAPHY_ONLY: {
    title: 'Solo similitud topográfica',
    message:
      'Los resultados comparan la forma del terreno derivada de modelos de elevación. No evalúan habitabilidad, geología, mineralogía, clima ni la idoneidad completa como análogo planetario.',
  },
  ACI_EXPERIMENTAL: {
    title: 'El ACI 0.1 es experimental',
    message:
      'El Analog Compatibility Index es un indicador experimental y explicable de similitud topográfica. Revise las diferencias por métrica, no solo la puntuación.',
  },
  SCALE_DEPENDENCE: {
    title: 'Dependencia de la escala',
    message:
      'Las métricas dependen del tamaño de celda. Los datos terrestres solo se comparan tras agregarlos a la malla MOLA MEGDR (~463 m); el terreno más fino no queda representado.',
  },
  MOLA_INTERPOLATED_BINS: {
    title: 'Bins MOLA interpolados',
    message:
      'MOLA MEGDR interpola los bins sin disparo láser. Cerca del ecuador solo ~55 % de los bins tiene un disparo y los huecos entre perfiles llegan a 12 km (etiqueta del producto). La resolución efectiva es más gruesa que la malla de 463 m.',
  },
  MEGDR_GDAL_PIXEL_SCALE: {
    title: 'Georreferenciación de MEGDR',
    message:
      'GDAL deriva un píxel de 463,00 m del valor redondeado MAP_SCALE; el espaciado exacto para 128 px/° en una esfera de 3396 km es 463,058 m. MARS-ANALOG construye y prueba su propia geotransformación antes de recortar regiones.',
  },
  SRTM_VOID_FILL: {
    title: 'Píxeles SRTM rellenados',
    message:
      'Los vacíos de SRTMGL1 v003 se rellenaron con ASTER GDEM2, GMTED2010 o NED. Los píxeles rellenados se identifican con SRTMGL1N y no se tratan como mediciones SRTM.',
  },
  GMTED_SOUTH_AMERICA_SHIFT: {
    title: 'Desplazamiento de GMTED2010 en Sudamérica',
    message:
      'La guía de usuario de SRTM v3 informa un desplazamiento de georreferenciación del relleno GMTED2010 en partes de Sudamérica. Esos píxeles se excluyen de las estadísticas.',
  },
  DEM_NOISE_FLAT_TERRAIN: {
    title: 'Ruido del DEM en terreno plano',
    message:
      'En superficies muy planas, como el Salar de Uyuni, la pendiente y la curvatura pueden estar dominadas por el ruido del modelo de elevación. Se marcan cuando quedan bajo el piso de ruido.',
  },
  DIFFERENT_VERTICAL_REFERENCES: {
    title: 'Referencias verticales distintas',
    message:
      'Las alturas SRTM se refieren al geoide EGM96 y las de MOLA al areoide GMM3. Solo se comparan métricas relativas derivadas, nunca elevaciones absolutas.',
  },
  AOI_DEFINITION_DEPENDENCE: {
    title: 'Dependencia de los límites de cada región',
    message:
      'Los resultados dependen de cómo se delimita cada región fija. Los límites y sus fuentes se versionan y se muestran con cada resultado.',
  },
}

export const SEVERITY_LABELS = { critical: 'Crítica', warning: 'Advertencia', info: 'Información' }

export function localizeLimitation(item) {
  const es = ES[item.code]
  return es ? { ...item, ...es } : item
}

export const FALLBACK_LIMITATION =
  'MARS-ANALOG mide únicamente similitud topográfica experimental; no evalúa habitabilidad ni idoneidad completa como análogo planetario.'
