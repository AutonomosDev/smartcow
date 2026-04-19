-- Setup inicial de la DB de staging dentro del mismo contenedor Postgres de prod.
-- Correr UNA VEZ desde el host del VPS:
--   docker exec -i smartcow-db-1 psql -U postgres < scripts/init-staging-db.sql
--
-- Reemplazar <PASSWORD_STAGING> por la password que uses para DATABASE_URL_STAGING.

CREATE USER smartcow_stg WITH PASSWORD '<PASSWORD_STAGING>';
CREATE DATABASE smartcow_staging OWNER smartcow_stg;
GRANT ALL PRIVILEGES ON DATABASE smartcow_staging TO smartcow_stg;

\c smartcow_staging
GRANT ALL ON SCHEMA public TO smartcow_stg;
