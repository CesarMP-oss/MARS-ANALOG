# Contribuir a MARS-ANALOG

## Ramas

- `main` es estable y está protegida: todo cambio entra por Pull Request con CI en verde
  y la aprobación de la otra persona del equipo.
- Ramas cortas desde `main`:
  `feat/<tema>`, `fix/<tema>`, `sci/<tema>` (cambia cálculos o resultados),
  `docs/<tema>`, `chore/<tema>`, `ci/<tema>`.
- Merge por *squash*. Las demos se etiquetan `v0.x.y`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`, con alcance opcional.

```text
feat(api): add comparisons endpoint
fix(metrics): handle NoData at tile edges
```

## Regla de cambio de resultados

Si un PR cambia valores numéricos de resultados científicos, debe:

1. marcarlo en la plantilla del PR;
2. actualizar las pruebas de referencia;
3. incrementar `pipeline_version` o `aci_version`;
4. explicarlo en `docs/science/CHANGELOG.md`.

## Integridad científica

- Solo datasets reales y trazables, con cita y checksum.
- NoData se propaga; nunca se rellena.
- Datos sintéticos solo en `backend/tests/fixtures/`, con `"is_synthetic": true`.
- Los resultados se describen como similitud topográfica, nunca como habitabilidad.
- No subir datos pesados ni credenciales (CI lo comprueba).

## Configuración inicial de Git

```bash
git config --global user.name  "Nombre Apellido"
git config --global user.email "correo@ejemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
# Windows: git config --global core.autocrlf true   (.gitattributes fija LF en el repositorio)
```
