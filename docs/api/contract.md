# Contrato de la API — v1

Fuente de verdad ejecutable: `backend/src/mars_analog/schemas.py` (modelos Pydantic) y
OpenAPI en `http://localhost:8000/docs`. Este documento explica las reglas.

## Principios

1. **Solo lectura.** Todos los endpoints son `GET`. La API sirve resultados precalculados por el
   pipeline offline; nunca calcula métricas ni ACI al vuelo.
2. **Sin valores de relleno.** Si un resultado no existe, la API responde `200` con
   `status: "not_computed"` y valores `null`. Si la cobertura válida es insuficiente,
   `status: "insufficient_data"` y valores `null`. Ninguno de los dos es un error.
3. **Limitaciones y procedencia en cada respuesta.** El sobre siempre incluye `limitations`
   (empezando por `TOPOGRAPHY_ONLY`) y los `provenance_ids` de los resultados devueltos.
4. **Datos sintéticos** solo en pruebas: registros con `is_synthetic: true` se ignoran salvo
   que `allow_synthetic` esté activado (solo lo hacen las pruebas automatizadas).

## Sobre de respuesta (2xx)

```json
{
  "api_version": "1.0",
  "data": {},
  "meta": {"generated_at": "…", "run_id": null, "software_version": "0.1.0",
           "git_commit": "abc1234", "is_synthetic": false},
  "limitations": [{"code": "TOPOGRAPHY_ONLY", "severity": "critical", "title": "…", "message": "…"}],
  "provenance_ids": []
}
```

## Errores (4xx/5xx)

```json
{"error": {"code": "region_not_found", "message": "…", "details": {}}}
```

Códigos: `not_found`, `method_not_allowed`, `invalid_request` (422), `invalid_identifier` (400),
`region_not_found`, `dataset_not_found`, `provenance_not_found`, `scale_not_available`,
`not_a_reference_region`, `not_a_candidate_region`, `results_store_invalid` (500).

## Endpoints

| Ruta | `data` |
|---|---|
| `GET /api/v1/health` | `Health`: versiones de software, Python, GDAL, PROJ; `results_run_id` |
| `GET /api/v1/limitations` | catálogo completo `Limitation[]` |
| `GET /api/v1/datasets`, `/datasets/{id}` | `Dataset[]` / `Dataset` (de `data/manifest.yaml`) |
| `GET /api/v1/regions?body=earth\|mars`, `/regions/{id}` | `Region[]` / `Region` (GeoJSON Feature) |
| `GET /api/v1/regions/{id}/metrics?scale_m=` | `RegionMetrics` (5 `MetricSummary`) |
| `GET /api/v1/comparisons?reference={id}` | `AciResult[]` calculados |
| `GET /api/v1/comparisons/{reference}/{candidate}` | `AciResult` (o `not_computed`) |
| `GET /api/v1/provenance/{provenance_id}` | `Provenance` |

## Regiones y coordenadas planetarias

Las regiones son GeoJSON `Feature` con coordenadas `[longitud, latitud]` en grados **del cuerpo
indicado**:

| `body` | `crs` obligatorio | Convención |
|---|---|---|
| `earth` | `EPSG:4326` | WGS84 |
| `mars` | `IAU_2015:49900` | planetocéntrica, este positivo, longitud `-180..180` |

RFC 7946 asume WGS84; para Marte nos apartamos del estándar de forma explícita mediante `body` y
`crs`, y el esquema rechaza una región marciana etiquetada como `EPSG:4326`. MOLA usa longitudes
`0..360`; el pipeline las convierte a `-180..180` (Jezero, ~77.7°E, no cambia).

**Mapas (hito 5):** el mapa de Marte **no** usará mapas base ni teselas terrestres. Se mostrará
un hillshade generado a partir del DEM procesado como `L.imageOverlay` sobre un CRS propio
(`L.CRS.Simple` o equirectangular planetocéntrico), y se añadirá una prueba que verifique que
coordenadas conocidas de Jezero caen en el píxel esperado.

## Estados de métricas (`MetricSummary.status`)

| Estado | ¿Valores? | Significado |
|---|---|---|
| `ok` | sí (resumen completo + `provenance_id`) | calculado |
| `below_noise_floor` | sí, con bandera `DEM_NOISE_FLAT_TERRAIN` | señal no supera el ruido estimado del DEM |
| `insufficient_data` | no (`null`) | cobertura válida bajo el umbral |
| `not_computed` | no (`null`) | aún no calculado |

Métricas y unidades: `slope` (degree), `tri_riley` (m), `local_relief` (m),
`profile_curvature` (1/m), `plan_curvature` (1/m).

## Resultado ACI (`AciResult`)

- `interpretation` es siempre `"topographic_similarity_only"` y `disclaimer` es un texto fijo;
  el esquema rechaza cualquier otro valor.
- `status != "ok"` ⇒ `score`, intervalo y valores de componentes son `null`.
- `status == "ok"` ⇒ `score` y `provenance_id` obligatorios; cada componente incluida tiene
  `similarity`; los pesos de las componentes incluidas suman 1; las excluidas requieren
  `exclusion_reason`.
- Mientras no exista un cálculo, `components` es una lista vacía (no se presuponen pesos).

## Resultados en disco

```
data/results/
  LATEST                                   # run_id vigente
  <run_id>/run.json                        # RunInfo
  <run_id>/regions/<region_id>/metrics.json
  <run_id>/comparisons/<reference>__<candidate>.json
  <run_id>/provenance/<provenance_id>.json
```

Un `Provenance` con `software.git_dirty: true` se mostrará en la interfaz como “no reproducible”.

## Versionado

`api_version` sigue `MAJOR.MINOR`: campos nuevos opcionales incrementan MINOR; cambios
incompatibles incrementan MAJOR y el prefijo de ruta (`/api/v2`).
