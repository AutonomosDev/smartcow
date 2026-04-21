-- AUT-272: Crear base de datos para Langfuse self-hosted.
-- Ejecutar ANTES de levantar el servicio langfuse.
-- Langfuse corre sus propias migrations internas al arrancar.
--
-- Uso en VPS:
--   docker compose exec db psql -U smartcow -c "CREATE DATABASE langfuse;"
-- O con el archivo:
--   docker compose exec -T db psql -U smartcow -f /scripts/create-langfuse-db.sql

CREATE DATABASE langfuse;
