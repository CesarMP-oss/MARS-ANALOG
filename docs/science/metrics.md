# Métricas topográficas — borrador (NO implementado)

Estado: definición propuesta; se implementará y validará en el hito 3, previa aprobación.
Todas las métricas se calculan en un CRS métrico local, a la escala común de comparación
(~463 m, malla MOLA MEGDR), propagando NoData (una ventana con algún NoData produce NoData).

| Métrica | Unidad | Definición propuesta | Referencia |
|---|---|---|---|
| `slope` | grados | Gradiente 3×3 de Horn | Horn (1981), Proc. IEEE 69(1) |
| `tri_riley` | m | Raíz de la suma de diferencias cuadradas con los 8 vecinos | Riley et al. (1999), Intermountain J. Sci. 5 |
| `local_relief` | m | máx − mín en un radio fijo (`parameters.radius_m`) | — |
| `profile_curvature`, `plan_curvature` | 1/m | Polinomio cuadrático 3×3 | Zevenbergen & Thorne (1987), ESPL 12 |

Piso de ruido: se definirá antes de calcular (ver `validation.md`); métricas por debajo del
ruido se marcan `below_noise_floor` con la bandera `DEM_NOISE_FLAT_TERRAIN`.
