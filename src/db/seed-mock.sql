-- seed-mock.sql — Datos de desarrollo para fundo_id=2, org_id=3
-- Uso: psql $DATABASE_URL -f src/db/seed-mock.sql

BEGIN;

-- ─── CATÁLOGOS ───────────────────────────────────────────────────────────────

INSERT INTO tipo_ganado (nombre) VALUES
  ('Novillo'),
  ('Vaquilla'),
  ('Toro'),
  ('Vaca'),
  ('Ternero')
ON CONFLICT DO NOTHING;

INSERT INTO razas (nombre) VALUES
  ('Hereford'),
  ('Aberdeen Angus'),
  ('Simmental'),
  ('Holstein'),
  ('Limousin')
ON CONFLICT DO NOTHING;

INSERT INTO estado_reproductivo (nombre) VALUES
  ('Vacía'),
  ('Preñada'),
  ('Lactando'),
  ('Seca'),
  ('Vaquilla')
ON CONFLICT DO NOTHING;

-- ─── ANIMALES (fundo_id=2, org_id=3) ─────────────────────────────────────────

INSERT INTO animales (fundo_id, diio, sexo, fecha_nacimiento, tipo_ganado_id, raza_id, estado, modulo_actual) VALUES
  (2, '076-000001', 'M', '2023-01-15', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000002', 'M', '2023-02-10', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000003', 'M', '2023-01-20', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000004', 'M', '2023-03-05', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Simmental'), 'activo', 'feedlot'),
  (2, '076-000005', 'M', '2023-02-28', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000006', 'M', '2023-01-08', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Limousin'), 'activo', 'feedlot'),
  (2, '076-000007', 'M', '2023-03-12', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000008', 'M', '2023-02-18', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000009', 'M', '2023-01-25', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Simmental'), 'activo', 'feedlot'),
  (2, '076-000010', 'M', '2023-04-01', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000011', 'M', '2023-03-22', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Limousin'), 'activo', 'feedlot'),
  (2, '076-000012', 'M', '2023-02-14', (SELECT id FROM tipo_ganado WHERE nombre='Novillo'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000013', 'M', '2024-01-10', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000014', 'M', '2024-02-05', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000015', 'M', '2024-01-20', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Simmental'), 'activo', 'feedlot'),
  (2, '076-000016', 'M', '2024-03-01', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000017', 'M', '2024-02-18', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Limousin'), 'activo', 'feedlot'),
  (2, '076-000018', 'M', '2024-01-28', (SELECT id FROM tipo_ganado WHERE nombre='Ternero'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000019', 'H', '2023-05-10', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Holstein'), 'activo', 'feedlot'),
  (2, '076-000020', 'H', '2023-06-15', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000021', 'H', '2023-04-20', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Aberdeen Angus'), 'activo', 'feedlot'),
  (2, '076-000022', 'H', '2023-07-08', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Holstein'), 'activo', 'feedlot'),
  (2, '076-000023', 'H', '2023-05-25', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Simmental'), 'activo', 'feedlot'),
  (2, '076-000024', 'H', '2023-08-12', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Hereford'), 'activo', 'feedlot'),
  (2, '076-000025', 'H', '2023-06-30', (SELECT id FROM tipo_ganado WHERE nombre='Vaquilla'), (SELECT id FROM razas WHERE nombre='Limousin'), 'activo', 'feedlot')
ON CONFLICT (fundo_id, diio) DO NOTHING;

-- ─── LOTES ───────────────────────────────────────────────────────────────────

INSERT INTO lotes (fundo_id, org_id, nombre, fecha_entrada, fecha_salida_estimada, objetivo_peso_kg, estado) VALUES
  (2, 3, 'Lote Novillos Premium', '2025-10-01', '2026-06-01', 480.00, 'activo'),
  (2, 3, 'Guachera Sur',          '2025-12-01', '2026-08-01', 220.00, 'activo'),
  (2, 3, 'Vaquillas Engorda',     '2025-09-15', '2026-05-15', 380.00, 'activo')
ON CONFLICT DO NOTHING;

-- ─── LOTE_ANIMALES ───────────────────────────────────────────────────────────

-- Lote 1: Novillos Premium (animales 1-12)
INSERT INTO lote_animales (lote_id, animal_id, fecha_entrada, peso_entrada_kg)
SELECT
  (SELECT id FROM lotes WHERE nombre='Lote Novillos Premium' AND fundo_id=2),
  a.id,
  '2025-10-01',
  (320 + (a.id % 7) * 15)::numeric
FROM animales a
WHERE a.fundo_id=2 AND a.diio IN (
  '076-000001','076-000002','076-000003','076-000004',
  '076-000005','076-000006','076-000007','076-000008',
  '076-000009','076-000010','076-000011','076-000012'
)
ON CONFLICT DO NOTHING;

-- Lote 2: Guachera Sur (terneros 13-18)
INSERT INTO lote_animales (lote_id, animal_id, fecha_entrada, peso_entrada_kg)
SELECT
  (SELECT id FROM lotes WHERE nombre='Guachera Sur' AND fundo_id=2),
  a.id,
  '2025-12-01',
  (120 + (a.id % 5) * 10)::numeric
FROM animales a
WHERE a.fundo_id=2 AND a.diio IN (
  '076-000013','076-000014','076-000015',
  '076-000016','076-000017','076-000018'
)
ON CONFLICT DO NOTHING;

-- Lote 3: Vaquillas Engorda (vaquillas 19-25)
INSERT INTO lote_animales (lote_id, animal_id, fecha_entrada, peso_entrada_kg)
SELECT
  (SELECT id FROM lotes WHERE nombre='Vaquillas Engorda' AND fundo_id=2),
  a.id,
  '2025-09-15',
  (240 + (a.id % 6) * 12)::numeric
FROM animales a
WHERE a.fundo_id=2 AND a.diio IN (
  '076-000019','076-000020','076-000021','076-000022',
  '076-000023','076-000024','076-000025'
)
ON CONFLICT DO NOTHING;

-- ─── PESAJES ─────────────────────────────────────────────────────────────────

-- Pesaje 1: entrada (oct/dic/sep 2025) — ya está en lote_animales como peso_entrada_kg
-- Pesaje 2: control enero 2026
INSERT INTO pesajes (fundo_id, animal_id, peso_kg, fecha)
SELECT
  2,
  a.id,
  (la.peso_entrada_kg + (a.id % 8) * 8 + 25)::numeric,
  '2026-01-15'
FROM animales a
JOIN lote_animales la ON la.animal_id = a.id
WHERE a.fundo_id = 2
ON CONFLICT DO NOTHING;

-- Pesaje 3: control marzo 2026
INSERT INTO pesajes (fundo_id, animal_id, peso_kg, fecha)
SELECT
  2,
  a.id,
  (la.peso_entrada_kg + (a.id % 8) * 8 + 55)::numeric,
  '2026-03-10'
FROM animales a
JOIN lote_animales la ON la.animal_id = a.id
WHERE a.fundo_id = 2
ON CONFLICT DO NOTHING;

-- Pesaje 4: control reciente abril 2026
INSERT INTO pesajes (fundo_id, animal_id, peso_kg, fecha)
SELECT
  2,
  a.id,
  (la.peso_entrada_kg + (a.id % 8) * 8 + 72)::numeric,
  '2026-04-05'
FROM animales a
JOIN lote_animales la ON la.animal_id = a.id
WHERE a.fundo_id = 2
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación
SELECT 'tipo_ganado' as tabla, COUNT(*) as filas FROM tipo_ganado
UNION ALL SELECT 'razas', COUNT(*) FROM razas
UNION ALL SELECT 'animales (fundo=2)', COUNT(*) FROM animales WHERE fundo_id=2
UNION ALL SELECT 'lotes (fundo=2)', COUNT(*) FROM lotes WHERE fundo_id=2
UNION ALL SELECT 'lote_animales', COUNT(*) FROM lote_animales
UNION ALL SELECT 'pesajes (fundo=2)', COUNT(*) FROM pesajes WHERE fundo_id=2;
