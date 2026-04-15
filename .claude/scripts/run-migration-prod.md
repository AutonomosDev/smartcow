# Ejecutar migración 0007_conversaciones en producción

## Bloqueante crítico para AUT-144 (persistencia de conversaciones)

Sin esta migración, cualquier llamada a `/api/conversations` falla con error SQL en producción.

---

## Opción 1: Via Cloud Run (recomendado)

Desde la máquina con gcloud CLI configurada:

```bash
# 1. Deploy una versión de desarrollo que ejecute la migración
gcloud run deploy smartcow-migrate \
  --source . \
  --region us-central1 \
  --set-env-vars="RUN_MIGRATION=1" \
  --no-allow-unauthenticated

# 2. Invocar una única vez
gcloud run jobs create smartcow-migrate-job \
  --image gcr.io/smartcow-c22fb/smartcow:latest \
  --set-env-vars="RUN_MIGRATION=1" \
  --region us-central1

gcloud run jobs execute smartcow-migrate-job --region us-central1
```

O más simple: dentro de un Cloud Run revision existente, ejecutar:

```bash
npm run db:migrate
```

(Ya que `DATABASE_URL` está inyectada como secret en el runtime)

---

## Opción 2: Cloud SQL Console (manual, menos seguro)

1. Abrir Cloud Console: https://console.cloud.google.com
2. Navegar a Cloud SQL > instancia `smartcow-492119:southamerica-west1:smartcow-db`
3. Pestaña "SQL Editor"
4. Copiar y pegar el contenido de `src/db/migrations/0007_conversaciones.sql`
5. Ejecutar

---

## Opción 3: Cloud SQL Auth Proxy (si tienes acceso local a GCP)

```bash
# Instalar proxy
gcloud sql connect smartcow-db --project smartcow-492119 --user postgres

# Ejecutar SQL
psql -h 127.0.0.1 -U postgres -d smartcow -f src/db/migrations/0007_conversaciones.sql
```

---

## Verificación post-migración

Confirmar que la tabla existe:

```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'conversaciones';
```

Debe retornar una fila. Si no, la migración no se ejecutó correctamente.

---

## Status

- Archivo SQL: ✓ `src/db/migrations/0007_conversaciones.sql`
- Journal actualizado: ✓ `src/db/migrations/meta/_journal.json` (idx: 7)
- Commit en main: ✓ `3649d95` + `68ed6b7`
- Migración ejecutada: ⏳ **PENDIENTE** (requiere acceso a Cloud SQL producción)

Sin esta migración, AUT-144 no funciona en producción.
