# Plan de validación — borrador

| Nivel | Qué se verifica | Hito |
|---|---|---|
| Entorno | Python 3.12, GDAL con drivers PDS/SRTMHGT, PROJ ≥ 9 con IAU_2015 | H0 (CI) |
| Contrato | Esquemas: sin valores en `not_computed`/`insufficient_data`, aviso ACI fijo, CRS por cuerpo | H0 (CI) |
| Datos | sha256 de cada archivo; georreferencia de MEGDR contra coordenadas del gazetteer | H1 |
| Preprocesamiento | NoData nunca se rellena (pruebas de propiedad); tamaño de píxel en metros | H2 |
| Métricas | Superficies analíticas (plano, paraboloide), invariancias, cotejo con `gdaldem` | H3 |
| Ruido | Piso de ruido del DEM (zona plana del Salar de Uyuni; ruido de MOLA) | H2–H3 |
| ACI | Identidad (Jezero vs Jezero = 1), monotonicidad, sensibilidad a pesos y regiones | H4 |
| Extremo a extremo | Demo reproducible desde un clon limpio | H5 |

## Verificaciones previas al procesamiento científico

- [ ] Geometrías fijas de las cinco regiones definidas, justificadas y versionadas.
- [ ] Georreferencia de MEGDR (463.058 m vs 463.00 m de GDAL) comprobada con coordenadas conocidas.
- [ ] Fracción de bins MOLA interpolados en Jezero medida con `MEGC44N000HB`.
- [ ] Política de SRTMGL1N (qué códigos se aceptan) aprobada.
- [ ] Piso de ruido del DEM estimado (Salar de Uyuni y MOLA).
- [ ] Método de remuestreo de SRTM a la escala MOLA aprobado.
- [ ] CRS métrico local de trabajo por región definido.
- [ ] Diferencia de referencias verticales (EGM96 vs areoide) documentada como irrelevante para métricas locales.
- [ ] Credenciales Earthdata configuradas fuera del repositorio.
- [ ] Citas y DOIs de todos los datasets confirmados.
