# ACI 0.1 — borrador (NO implementado)

Estado: metodología aprobada en principio; se implementará en el hito 4.
Interpretación fija: **similitud topográfica experimental**. No mide habitabilidad ni idoneidad
completa como análogo planetario.

Para cada métrica *m* con datos suficientes en la referencia *R* (Jezero) y el candidato *C*:

1. Distancia de Wasserstein 1-D entre distribuciones de píxeles válidos: `d_m = W1(R_m, C_m)`
   (en unidades físicas).
2. Normalización por la dispersión de la referencia: `d̂_m = d_m / IQR(R_m)`.
3. Similitud: `s_m = exp(-d̂_m)` ∈ (0, 1].
4. Agregación con pesos iguales sobre las métricas incluidas: `ACI = Σ w_m s_m`, `Σ w_m = 1`.

Cada resultado expone distancias, distancias normalizadas, similitudes, pesos, métricas
excluidas con motivo, fracciones válidas, intervalo de incertidumbre (bootstrap espacial por
bloques), escala de comparación, versión y procedencia.

Pendiente de decidir antes de H4: si la curvatura cuenta como una métrica (perfil + plano
promediados) o como dos; tratamiento de métricas `below_noise_floor`.
