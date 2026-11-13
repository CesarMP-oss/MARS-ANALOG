# Catálogo de limitaciones científicas

Los textos completos viven en `backend/src/mars_analog/limitations.py` y se sirven en
`GET /api/v1/limitations`; la interfaz muestra el mismo texto. Una prueba verifica que cada
código aparece en esta tabla.

| Código | Severidad | Título |
|---|---|---|
| `TOPOGRAPHY_ONLY` | critical | Topographic similarity only |
| `ACI_EXPERIMENTAL` | critical | ACI 0.1 is experimental |
| `SCALE_DEPENDENCE` | warning | Scale dependence |
| `MOLA_INTERPOLATED_BINS` | warning | Interpolated MOLA bins |
| `MEGDR_GDAL_PIXEL_SCALE` | info | MEGDR georeferencing check |
| `SRTM_VOID_FILL` | warning | SRTM void-filled pixels |
| `GMTED_SOUTH_AMERICA_SHIFT` | info | GMTED2010 offset in South America |
| `DEM_NOISE_FLAT_TERRAIN` | warning | DEM noise on flat terrain |
| `DIFFERENT_VERTICAL_REFERENCES` | info | Different vertical references |
| `AOI_DEFINITION_DEPENDENCE` | warning | Dependence on region boundaries |

`TOPOGRAPHY_ONLY` se incluye en todas las respuestas de la API.
