# SmartCow — Skills

Skills de análisis de datos instalados en el proyecto. Fuente: [nimrodfisher/data-analytics-skills](https://github.com/nimrodfisher/data-analytics-skills) — librería de 31 skills portátiles para Claude Code.

## Por qué estas skills

El dashboard del chat se construyó ad-hoc: queries hardcodeadas, KPIs sin valor operacional, datos zombie del ETL contaminando los resultados. Antes de seguir construyendo analytics encima de datos sucios, hay que **regular la DB**: mapear schema, auditar calidad, validar queries.

Estas skills son la base para esa limpieza.

## Skills instalados

| Skill | Para qué | Cuándo invocarlo |
|-------|----------|------------------|
| **schema-mapper** | Descubrir tablas, columnas, FKs, join paths. Genera ERD Mermaid + data dictionary. | Empezar aquí. Mapear el schema completo de smartcow antes de cualquier otro análisis. |
| **data-quality-audit** | Auditoría contra reglas de negocio: zombies, nulls, duplicados, frescura. Produce scorecard. | Detectar los animales fantasma, fechas inválidas (ej. inseminaciones 2053-04-17), estados inconsistentes. |
| **programmatic-eda** | Exploración sistemática: estructura, nulls, outliers, distribuciones, correlaciones. | Cuando recibimos data nueva (ej. próximo ETL AgroApp) y hay que perfilarla antes de confiar en ella. |
| **query-validation** | Review de SQL: correctness, performance, anti-patterns. | Antes de promover una query a dashboard de producción o cuando una query es lenta/sospechosa. |
| **metric-reconciliation** | Investigar discrepancias entre fuentes de la misma métrica. | Cuando un KPI da distinto en chat vs dashboard vs Linear. |

## Cómo se invocan

Cada skill se activa automáticamente cuando le pides a Claude algo que matchea su `description` en el frontmatter. Ejemplos:

```
"mapea el schema de smartcow"                    → schema-mapper
"audita la calidad de la tabla animales"         → data-quality-audit
"explora la tabla pesajes, perfílala"            → programmatic-eda
"revisa este SQL antes de pasarlo a prod"        → query-validation
"por qué el conteo de vacas vivas no cuadra"     → metric-reconciliation
```

También puedes forzar la invocación nombrando explícitamente: `"usa el skill schema-mapper para..."`.

## Orden recomendado para regularizar la DB

```
1. schema-mapper          → mapear todo el schema
2. data-quality-audit     → encontrar zombies y datos sucios
3. programmatic-eda       → perfilar tablas dominio (animales, pesajes, partos)
4. metric-reconciliation  → reconciliar KPIs que dan distinto entre fuentes
5. query-validation       → validar queries del dashboard antes de prod
```

## Estructura

```
.claude/skills/
├── README.md                         (este archivo)
├── schema-mapper/SKILL.md
├── data-quality-audit/SKILL.md
├── programmatic-eda/SKILL.md
├── query-validation/SKILL.md
└── metric-reconciliation/SKILL.md
```

Cada skill es un solo `SKILL.md` (igual al repo origen). Si una skill se queda corta para smartcow, se le agrega `references/` con contexto específico (schema Drizzle, definiciones de KPIs ganaderos, reglas de negocio).

## Categoría: 01-data-quality-validation

Estas 5 skills son la categoría **completa** de "Data Quality & Validation" del repo origen. Faltan otras 5 categorías (26 skills más) que se pueden agregar cuando se necesiten:

- 02-documentation-knowledge (semantic models, data catalog, etc.)
- 03-data-analysis-investigation (cohort, funnel, root-cause, etc.)
- 04-data-storytelling-visualization (dashboards, exec summary, etc.)
- 05-stakeholder-communication
- 06-workflow-optimization

## Referencia

Repo origen: https://github.com/nimrodfisher/data-analytics-skills
Categoría: https://github.com/nimrodfisher/data-analytics-skills/tree/main/01-data-quality-validation
