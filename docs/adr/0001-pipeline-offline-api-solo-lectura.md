# ADR-0001: Pipeline offline y API de solo lectura

- Estado: aceptado (2026-11-13)

## Contexto

El procesamiento de DEM es costoso y debe ser reproducible y auditable. El equipo es de dos
personas y la demo debe funcionar sin depender de servicios externos.

## Decisión

Los cálculos se ejecutan en un pipeline Python offline que escribe JSON versionados por
`run_id` en `data/results/`, con registros de procedencia. FastAPI solo lee esos archivos
(endpoints `GET`). React consume la API mediante un contrato versionado (`docs/api/contract.md`).

## Consecuencias

- La API no importa código de métricas ni ACI; los resultados no cambian por servirlos.
- Cualquier resultado puede rastrearse a datos (sha256), parámetros, versiones y commit.
- No hay base de datos, colas ni cálculo bajo demanda; añadir regiones requiere volver a
  ejecutar el pipeline.
