# MARS-ANALOG

Prototipo científico para la NASA Space Apps Challenge 2026 que compara la **topografía**
de regiones terrestres (Salar de Uyuni, Sajama, Altiplano boliviano, desierto de Atacama)
con una región de referencia en Marte (cráter Jezero).

> **Aviso científico.** MARS-ANALOG mide **similitud topográfica** a partir de modelos
> digitales de elevación (SRTM para la Tierra, MOLA MEGDR para Marte). **No** evalúa
> habitabilidad ni la idoneidad completa de un sitio como análogo planetario.
> El índice ACI 0.1 es **experimental**. Los datos faltantes nunca se rellenan con valores
> inventados.

## Estado

Hito 0 — infraestructura. Todavía **no** hay datos descargados, métricas calculadas ni ACI
implementado; la API responde `not_computed` donde aún no existen resultados.

## Arquitectura

```text
pipeline offline (Python)  ->  data/results/<run_id>/*.json  ->  FastAPI (solo lectura)  ->  React + Vite
```

- `backend/` — paquete Python `mars_analog` (API FastAPI; el pipeline científico llegará en hitos posteriores).
- `frontend/` — interfaz React + Vite.
- `docs/` — contrato de la API, documentación científica y decisiones de arquitectura.
- `data/` — manifiesto de datasets y regiones; los datos pesados **no** se versionan.

## Requisitos

- Python 3.12 (instalado automáticamente por [uv](https://docs.astral.sh/uv/))
- Node.js 24 LTS
- Git

GDAL y PROJ se obtienen de las wheels de `rasterio` y `pyproj` (no hace falta instalarlos
aparte, tampoco en Windows).

## Puesta en marcha

### Backend

```bash
cd backend
uv sync                      # crea .venv con Python 3.12 y las versiones fijadas en uv.lock
uv run pytest                # incluye la verificación del entorno GDAL/PROJ
uv run uvicorn mars_analog.api.main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm ci
npm run dev                  # http://localhost:5173 (proxy /api -> http://localhost:8000)
```

Comprobaciones: `npm run lint`, `npm test`, `npm run build`.

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

Código bajo licencia [MIT](LICENSE). Los datasets tienen sus propias condiciones de uso y
citas; ver `docs/science/datasets.md`.
