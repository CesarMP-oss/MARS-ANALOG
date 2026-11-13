# Datasets — hechos verificados

Verificado el 2026-11-13 contra documentación oficial, leyendo solo etiquetas y documentos
(sin descargar rasters). Los puntos marcados **[H1]** se confirmarán con los archivos descargados.

## SRTMGL1 V003 (Tierra)

- Producto: https://lpdaac.usgs.gov/products/srtmgl1v003/ — DOI `10.5067/MEASURES/SRTM/SRTMGL1.003`.
- Guía: SRTM User Guide V3, https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf
- 1 arc-second (~30 m), WGS84; alturas en metros sobre el geoide EGM96.
- Los vacíos de SRTM se rellenaron con ASTER GDEM2 y, en segundo lugar, GMTED2010 o NED.
  **Esos píxeles no son mediciones SRTM.**
- La guía documenta un desplazamiento de georreferencia de GMTED2010 en partes de Sudamérica.

## SRTMGL1N V003 (fuente por píxel)

- Producto: https://lpdaac.usgs.gov/products/srtmgl1nv003/ — DOI `10.5067/MEASURES/SRTM/SRTMGL1N.003`.
- Un byte por píxel con la fuente del valor de SRTMGL1. Según la guía V3, los valores
  **201–224 indican el número de pasadas SRTM** (medición real); los demás códigos identifican
  agua o fuentes de relleno (la tabla completa se transcribirá y verificará en **[H1]**).
- Política propuesta (a aprobar en H2): solo 201–224 cuentan como medidos; el resto se excluye y
  su fracción se reporta (`source_quality.earth_filled_fraction`).

## MOLA MEGDR 128 px/° (Marte)

- Archivo: https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/
- `DATA_SET_ID = MGS-M-MOLA-5-MEGDR-L3-V1.0`, versión de producto 2.0.
- Jezero está en `MEGT44N000HB` (0–44°N, 0–90°E): 11520 × 5632, int16 MSB, metros.
  Conteos de disparos por bin: `MEGC44N000HB` (11520 × 5632, 8 bits).
- Planetocéntrico, este positivo 0–360; esfera **R = 3 396 000 m** en la etiqueta
  (IAU 2015 usa 3 396 190 m). Topografía = radio − areoide GMM3 (mgm1025), grado y orden 50.
- Etiqueta: cada píxel es la mediana de las observaciones del bin; *“Where no observations lie
  within the area, an interpolated value is supplied … about 55% of bins contain at least one
  MOLA shot. There are gaps, however, of up to 12 km between profiles.”*
- **Georreferencia en GDAL:** GDAL deriva 463.00 m/píxel del valor redondeado `MAP_SCALE`;
  el valor exacto es 2π·3 396 000 / (360·128) = 463.058 m. A la longitud de Jezero (columna
  ~9 944) el desplazamiento acumulado es ~570 m (~1.2 píxeles). Construiremos la transformada
  a partir de `MAP_RESOLUTION` y la validaremos **[H1]**.

## Jezero

USGS Gazetteer of Planetary Nomenclature: centro 18.41°N, 77.69°E; diámetro 47.52 km. La geometría de la región se define en H1.

## Entorno geoespacial

Wheels de PyPI: rasterio 1.5.2 (GDAL 3.12.2, PROJ 9.8.1) y pyproj 3.8.0 (PROJ 9.8.1). Los códigos
`IAU_2015` están disponibles desde PROJ 8.2. `backend/tests/test_environment.py` lo comprueba.
