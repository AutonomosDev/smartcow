# SmartCow — Local DB Setup

## Databases on port 5440 (pg16-alpine)

| DB | Contenido | Uso |
|----|-----------|-----|
| `smartcow_local` | Prod + staging partos merge | **Working DB para desarrollo** |
| `smartcow_prod_snapshot` | Dump read-only de prod | Referencia / diff |
| `smartcow_staging_snapshot` | Dump read-only de staging | Referencia / diff |

## Arrancar el contenedor local

```bash
docker compose -f docker-compose.local-db.yml up -d
```

Puerto: `127.0.0.1:5440` (evita conflicto con pg14 Homebrew en 5432).  
Connection string dev: `postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local`

## Refrescar dumps

Los dumps se toman con SSH tunnel activo a prod/staging.

```bash
# 1. Levantar tunnel prod (si no está activo)
ssh -f -N -L 5435:172.16.1.3:5432 smartcow-vps

# 2. Levantar tunnel staging
ssh -f -N -L 5433:127.0.0.1:5433 smartcow-vps

# 3. Dump prod
pg_dump -h 127.0.0.1 -p 5435 -U smartcow -d smartcow \
  --no-owner --no-acl \
  > /tmp/smartcow-dumps/prod_dump.sql

# 4. Dump staging
pg_dump -h 127.0.0.1 -p 5433 -U smartcow -d smartcow \
  --no-owner --no-acl \
  > /tmp/smartcow-dumps/staging_dump.sql

# 5. Restaurar snapshots
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow -d postgres \
  -c "DROP DATABASE IF EXISTS smartcow_prod_snapshot; CREATE DATABASE smartcow_prod_snapshot;"
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_prod_snapshot -f /tmp/smartcow-dumps/prod_dump.sql

PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow -d postgres \
  -c "DROP DATABASE IF EXISTS smartcow_staging_snapshot; CREATE DATABASE smartcow_staging_snapshot;"
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_staging_snapshot -f /tmp/smartcow-dumps/staging_dump.sql
```

Los dumps van a `/tmp/` — **no commitear** (`.gitignore` cubre `*.dump`, `*.sql.gz`, `docs/db/dumps/`).

## Consolidar smartcow_local

`smartcow_local` = prod como base + staging-only partos (para preservar 1,338 cria_id).  
Ver `docs/db/prod-vs-staging-diff.md` para el análisis completo.

```bash
# Recrear smartcow_local desde prod
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow -d postgres \
  -c "DROP DATABASE IF EXISTS smartcow_local; CREATE DATABASE smartcow_local;"
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_local -f /tmp/smartcow-dumps/prod_dump.sql

# Copiar subtipo_parto catalog (requerido por staging partos)
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_staging_snapshot -c "COPY subtipo_parto TO STDOUT" | \
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_local -c "COPY subtipo_parto FROM STDIN"

# Merge staging-only partos (preserva 1,338 cria_id linkages)
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_staging_snapshot \
  -c "COPY (SELECT predio_id, madre_id, fecha, resultado, cria_id, tipo_ganado_cria_id,
             tipo_parto_id, subtipo_parto_id, semen_id, inseminador_id,
             numero_partos, observaciones, usuario_id, creado_en
            FROM partos WHERE id > 5522 AND madre_id <= 38542) TO STDOUT" | \
PGPASSWORD=smartcow_local psql -h 127.0.0.1 -p 5440 -U smartcow \
  -d smartcow_local \
  -c "COPY partos (predio_id, madre_id, fecha, resultado, cria_id, tipo_ganado_cria_id,
                   tipo_parto_id, subtipo_parto_id, semen_id, inseminador_id,
                   numero_partos, observaciones, usuario_id, creado_en) FROM STDIN"
```

## .gitignore

Los dumps están cubiertos por `.gitignore`:
```
*.dump
*.sql.gz
docs/db/dumps/
```
