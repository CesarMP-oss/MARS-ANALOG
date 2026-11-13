# Datos

| Carpeta | Contenido | ¿En git? |
|---|---|---|
| `manifest.yaml` | Datasets, DOIs, URLs, archivos y sha256 | Sí |
| `aoi/` | GeoJSON versionados de las regiones fijas (hito 1) | Sí |
| `raw/` | Descargas originales, verificadas por sha256 | **No** |
| `processed/` | Recortes y rasters intermedios | **No** |
| `results/` | Salidas del pipeline (`LATEST`, `<run_id>/…`), leídas por la API | **No** |

Reglas:

- Solo datasets reales y trazables, descritos en `manifest.yaml` con cita y checksum.
- NoData se propaga; **nunca** se rellena ni se interpola.
- Los datos pesados no se suben al repositorio; CI rechaza archivos de datos y archivos > 5 MB.
- Coordenadas de regiones: Tierra en `EPSG:4326`; Marte en grados planetocéntricos, este
  positivo, `-180..180`, `IAU_2015:49900`. Ver `docs/api/contract.md`.
- Credenciales de NASA Earthdata en `~/.netrc` (o `_netrc` en Windows), nunca en el repositorio.
