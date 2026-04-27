# Prod vs Staging DB Diff

Generated: 2026-04-27  
Prod: `smartcow-db-1` (pg 16.13)  
Staging: `smartcow-db-staging` (pg 16.13)  
Local snapshots: `smartcow_prod_snapshot` / `smartcow_staging_snapshot` on port 5440

---

## Row counts

| Tabla | Prod | Staging | Diff |
|-------|-----:|--------:|-----:|
| tratamientos | 65,454 | 107,436 | staging +41,982 |
| pesajes | 79,848 | 39,924 | prod +39,924 |
| animales | 77,050 | 38,888 | prod +38,162 |
| bajas | 65,264 | 32,995 | prod +32,269 |
| ventas | 31,204 | 31,204 | equal |
| precios_feria | 14,196 | 14,196 | equal |
| partos | 11,044 | 13,643 | staging +2,599 |
| inseminaciones | 4,822 | 4,822 | equal |
| ecografias | 2,732 | 2,732 | equal |
| areteos | 1,384 | 1,384 | equal |
| semen | 306 | 306 | equal |
| traslados | 0 | 198 | staging +198 |
| baja_causa | 0 | 138 | staging +138 |
| inventarios | 0 | 27 | staging +27 |
| subtipo_parto | 0 | 7 | staging +7 |

**Predios**: Prod has 26 (IDs 1–26: 13 JP Ferrada + 13 Demo). Staging has 13 (IDs 1–13: JP Ferrada only).  
**Orgs**: Prod has 3 (JP Ferrada, Fundo Demo, staging test). Staging has 1 (Org Staging 1).

---

## Schema diff

Only one column differs:

| Tabla | Columna | Prod | Staging |
|-------|---------|------|---------|
| users | trial_until | timestamp with timezone (nullable) | absent |

Prod has `users.trial_until` added after the last staging sync. No FK impact.

**Indexes**: identical between prod and staging (same index definitions on all tables).

---

## Data diff — partos.cria_id (the 1,338 extra linkages)

| Metric | Prod | Staging |
|--------|-----:|--------:|
| partos total | 11,044 | 13,643 |
| cria_id NOT NULL | 996 | 2,334 |
| cria_id NULL (resultado='vivo') | 10,048 | 11,000 |

### Analysis

Staging has 13,643 partos vs prod's 11,044. The extra 2,599 staging partos come from additional ETL import runs that ran on staging but not on prod.

Of staging's 2,334 cria_id linkages:
- **996** correspond to partos IDs 1–5,522 (synced from prod) → prod already has these from the AUT-309 backfill
- **1,338** correspond to partos IDs 5,523–13,643 (staging-only partos) → prod does NOT have these records

The 1,338 staging-only partos with cria_id:
- All `cria_id` values (range 4,372–5,979) reference animals that exist in prod
- 8,121 total staging-only partos imported; 49 excluded because `madre_id > 38,542` (staging-only animals)
- Sample:
  ```
  parto_id | predio | madre_diio | fecha      | cria_diio
  ---------|--------|------------|------------|----------
  13616    | 9      | 14476361   | 2020-07-14 | 21430693
  13600    | 9      | 23547643   | 2020-07-14 | 18086800
  13584    | 9      | 25836201   | 2020-07-15 | 18086818
  ```

---

## Other notable divergences

### tratamientos (+41,982 in staging)

Staging received AUT-298 re-import (tratamientos con trazabilidad SAG, ~74.8k total).  
Prod still has pre-AUT-298 tratamientos (65,454). AUT-298 is merged to main but not yet run on prod.

### pesajes / animales (prod has ~2× more)

Prod has been receiving new ETL imports (animales 77k vs 38k, pesajes 80k vs 40k).  
Staging has not been re-synced since the last `sync-staging-from-prod.sh` run.

### traslados / baja_causa / inventarios (staging only)

Staging has data in these tables (198/138/27 rows respectively); prod has 0.  
These appear to be staging-specific test data or features not yet activated on prod.

---

## Consolidation decision for smartcow_local

| Data | Decision | Reason |
|------|----------|--------|
| Prod data (all tables) | ✅ included | Prod is more complete for animales/pesajes |
| Staging-only partos (8,072 records) | ✅ included | Preserves the 1,338 cria_id linkages |
| subtipo_parto catalog (7 rows) | ✅ included | Required FK for staging partos |
| Staging-only partos with invalid madre_id (49) | ❌ excluded | FK violation, 0 cria_id loss |
| Staging tratamientos extra (+41k) | ❌ excluded | AUT-298 re-import should run on local via ETL |
| Staging traslados/baja_causa/inventarios | ❌ excluded | Out of scope, test data |
