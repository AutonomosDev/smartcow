-- Migration: Renombrar concepto "fundo" → "predio" en toda la DB
-- Ticket: AUT-113

-- 1. Renombrar tabla principal
ALTER TABLE fundos RENAME TO predios;
ALTER SEQUENCE fundos_id_seq RENAME TO predios_id_seq;

-- 2. Renombrar tabla de relación user_fundos → user_predios
ALTER TABLE user_fundos RENAME TO user_predios;

-- 3. Renombrar columna fundo_id → predio_id en todas las tablas
ALTER TABLE animales RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE areteos RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE bajas RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE ecografias RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE inseminaciones RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE inseminadores RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE lotes RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE medieros RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE movimientos_potrero RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE partos RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE pesajes RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE potreros RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE semen RENAME COLUMN fundo_id TO predio_id;
ALTER TABLE user_predios RENAME COLUMN fundo_id TO predio_id;

-- 4. Renombrar FK constraints en tablas hijas
ALTER TABLE animales RENAME CONSTRAINT animales_fundo_id_fundos_id_fk TO animales_predio_id_predios_id_fk;
ALTER TABLE areteos RENAME CONSTRAINT areteos_fundo_id_fundos_id_fk TO areteos_predio_id_predios_id_fk;
ALTER TABLE bajas RENAME CONSTRAINT bajas_fundo_id_fundos_id_fk TO bajas_predio_id_predios_id_fk;
ALTER TABLE ecografias RENAME CONSTRAINT ecografias_fundo_id_fundos_id_fk TO ecografias_predio_id_predios_id_fk;
ALTER TABLE inseminaciones RENAME CONSTRAINT inseminaciones_fundo_id_fundos_id_fk TO inseminaciones_predio_id_predios_id_fk;
ALTER TABLE inseminadores RENAME CONSTRAINT inseminadores_fundo_id_fundos_id_fk TO inseminadores_predio_id_predios_id_fk;
ALTER TABLE lotes RENAME CONSTRAINT lotes_fundo_id_fundos_id_fk TO lotes_predio_id_predios_id_fk;
ALTER TABLE medieros RENAME CONSTRAINT medieros_fundo_id_fundos_id_fk TO medieros_predio_id_predios_id_fk;
ALTER TABLE movimientos_potrero RENAME CONSTRAINT movimientos_potrero_fundo_id_fundos_id_fk TO movimientos_potrero_predio_id_predios_id_fk;
ALTER TABLE partos RENAME CONSTRAINT partos_fundo_id_fundos_id_fk TO partos_predio_id_predios_id_fk;
ALTER TABLE pesajes RENAME CONSTRAINT pesajes_fundo_id_fundos_id_fk TO pesajes_predio_id_predios_id_fk;
ALTER TABLE potreros RENAME CONSTRAINT potreros_fundo_id_fundos_id_fk TO potreros_predio_id_predios_id_fk;
ALTER TABLE semen RENAME CONSTRAINT semen_fundo_id_fundos_id_fk TO semen_predio_id_predios_id_fk;
ALTER TABLE user_predios RENAME CONSTRAINT user_fundos_fundo_id_fundos_id_fk TO user_predios_predio_id_predios_id_fk;

-- 5. Renombrar PK constraint en user_predios
ALTER TABLE user_predios RENAME CONSTRAINT user_fundos_user_id_fundo_id_pk TO user_predios_user_id_predio_id_pk;

-- 6. Renombrar FK en predios (org_id)
ALTER TABLE predios RENAME CONSTRAINT fundos_org_id_organizaciones_id_fk TO predios_org_id_organizaciones_id_fk;
