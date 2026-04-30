# SmartCow — Data Dictionary

Generated: 2026-04-27
Source: src/db/schema/ + prod DB introspection
Total tables in prod: 38 (public schema)
Tables in schema only (not yet migrated): `inventarios`, `proveedores`

---

## Row counts (prod, 2026-04-27)

| Table | Rows |
|-------|------|
| pesajes | 79,848 |
| animales | 77,050 |
| tratamientos | 65,454 |
| ventas | 31,391 |
| precios_feria | 14,196 |
| partos | 11,044 |
| inseminaciones | 4,822 |
| ecografias | 2,732 |
| areteos | 1,384 |
| semen | 306 |
| user_predios | 87 |
| chat_usage | 36 |
| baja_motivo | 31 |
| predios | 26 |
| chat_cache | 26 |
| slash_commands | 16 |
| razas | 11 |
| users | 9 |
| tipo_ganado | 6 |
| estado_reproductivo | 5 |
| organizaciones | 3 |
| conversaciones | 2 |
| tipo_parto | 2 |
| All others | 0 |

---

## Layer 1 — Core Tenant

### organizaciones
Root of the multi-tenant model. Each org groups N predios.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| nombre | varchar(200) | NOT NULL | |
| rut | varchar(20) | UNIQUE, nullable | |
| plan | text | NOT NULL, default 'pro' | enum: free / pro / enterprise |
| usage_cap_usd | numeric(10,2) | NOT NULL, default 50.00 | Monthly LLM spend cap override |
| modulos | jsonb | default {} | Feature flags: {feedlot: bool, crianza: bool} |
| config | jsonb | default {} | Org-level config |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### predios
Physical farm/property. All domain tables carry predio_id.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| nombre | varchar(200) | NOT NULL | |
| region | varchar(100) | nullable | Chilean region |
| tipo_tenencia | enum | NOT NULL, default 'propio' | propio / arriendo |
| config | jsonb | default {} | Predio-level config |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

### users
System users. Belong to one org. Access to specific predios managed via user_predios.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| email | varchar(255) | NOT NULL, UNIQUE | |
| password_hash | varchar(255) | nullable | Null for Google SSO users |
| firebase_uid | varchar(128) | UNIQUE, nullable | DEPRECATED (AUT-215), pending removal |
| nombre | varchar(200) | NOT NULL | |
| rol | enum | NOT NULL, default 'operador' | superadmin / admin_org / admin_fundo / operador / veterinario / viewer / trial |
| trial_until | timestamp tz | nullable | AUT-289: demo expiry for rol=trial |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

### user_predios
N:M junction between users and predios. admin_org sees all predios without needing rows here.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | integer | NOT NULL, FK → users.id CASCADE | PK (composite) |
| predio_id | integer | NOT NULL, FK → predios.id CASCADE | PK (composite) |
| rol | enum | NOT NULL, default 'operador' | Same enum as users.rol |

---

## Layer 2 — Third Parties

### medieros
Third-party animal owners operating within a fundo. Covers mediería (shared cría) and hotelería (feedlot boarding). AUT-135/AUT-296.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| nombre | varchar(120) | NOT NULL | |
| rut | varchar(12) | nullable | |
| contacto | varchar(80) | nullable | |
| porcentaje_part | numeric(5,2) | nullable | Participation % for mediería contracts |
| tipo_negocio | enum | NOT NULL, default 'medieria' | medieria / hoteleria |
| activo | boolean | NOT NULL, default true | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### proveedores
*(schema only — NOT in prod DB)*
Cattle suppliers (ferias, criadores, intermediarios). AUT-296.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| nombre | varchar(120) | NOT NULL, UNIQUE per org | Canonical name |
| tipo | enum | NOT NULL, default 'desconocido' | feria / criador / intermediario / desconocido |
| rut | varchar(12) | nullable | |
| contacto | varchar(80) | nullable | |
| activo | boolean | NOT NULL, default true | |
| notas | text | nullable | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

---

## Layer 3 — Catalogos (Reference Data)

### tipo_ganado
Global catalog. Classification of animal type (vaca, novilla, ternero, etc.)

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| nombre | varchar(100) | NOT NULL, UNIQUE |

### razas
Global catalog. Bovine breeds.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| nombre | varchar(100) | NOT NULL, UNIQUE |

### estado_reproductivo
Global catalog. Reproductive state (vacía, preñada, etc.)

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| nombre | varchar(100) | NOT NULL, UNIQUE |

### tipo_parto
Global catalog. Birth type (normal, distócico, etc.)

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| nombre | varchar(100) | NOT NULL, UNIQUE |

### subtipo_parto
Global catalog. Birth subtype. Depends on tipo_parto.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| tipo_parto_id | integer | NOT NULL, FK → tipo_parto.id RESTRICT |
| nombre | varchar(100) | NOT NULL |

### baja_motivo
Global catalog. Top-level reason for animal loss (muerte, venta forzosa, descarte).

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| nombre | varchar(100) | NOT NULL, UNIQUE |

### baja_causa
Global catalog. Specific cause of loss. Depends on motivo.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| motivo_id | integer | NOT NULL, FK → baja_motivo.id RESTRICT |
| nombre | varchar(100) | NOT NULL |

### semen
Predio-scoped catalog. Bulls / semen straws for insemination.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| predio_id | integer | NOT NULL, FK → predios.id CASCADE |
| toro | varchar(200) | NOT NULL |

### inseminadores
Predio-scoped catalog. People who perform insemination.

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| predio_id | integer | NOT NULL, FK → predios.id CASCADE |
| nombre | varchar(200) | NOT NULL |

---

## Layer 4 — Core Domain: animales

Master animal registry. All event tables reference animal_id + predio_id.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| diio | varchar(50) | NOT NULL | Primary identifier (visual tag / DIIO) |
| eid | varchar(50) | nullable | RFID electronic tag — different from DIIO |
| tipo_ganado_id | integer | NOT NULL, FK → tipo_ganado.id RESTRICT | |
| raza_id | integer | nullable, FK → razas.id SET NULL | |
| sexo | enum | NOT NULL | M / H |
| fecha_nacimiento | date | nullable | |
| estado_reproductivo_id | integer | nullable, FK → estado_reproductivo.id SET NULL | |
| estado | enum | NOT NULL, default 'activo' | activo / baja / desecho |
| diio_madre | varchar(50) | nullable | Implicit genealogy link (no FK — historical) |
| padre | varchar(200) | nullable | Free text |
| abuelo | varchar(200) | nullable | Free text |
| origen | varchar(200) | nullable | Free text |
| tipo_propiedad | enum | NOT NULL, default 'propio' | propio / medieria |
| mediero_id | integer | nullable, FK → medieros.id SET NULL | Only when tipo_propiedad = 'medieria' |
| modulo_actual | enum | nullable | feedlot / crianza / ambos (AUT-129) |
| observaciones | varchar(500) | nullable | |
| desecho | boolean | NOT NULL, default false | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

**Indexes:** `(predio_id, diio)`, `(predio_id, estado)`

---

## Layer 5 — Event Tables

All event tables follow the same pattern:
- `predio_id` + `animal_id` always present (with `animal_id` as RESTRICT)
- `usuario_id` nullable FK → users (audit trail)
- `creado_en` timestamp

### pesajes
Weight records. Origin: AgroApp Pesaje2 module + manual entry.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| peso_kg | numeric(8,2) | NOT NULL | |
| fecha | date | NOT NULL | |
| dispositivo | varchar(100) | nullable | 'agroapp' / 'agroapp_venta' / null |
| edad_meses | numeric(5,1) | nullable | Copy from xlsx |
| observaciones | text | nullable | |
| es_peso_llegada | boolean | NOT NULL, default false | First weight at destination predio |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

**Unique:** `(animal_id, fecha, peso_kg)` — idempotency for AgroApp imports
**Indexes:** `(animal_id, fecha)`, `(predio_id, fecha)`

### partos
Birth records. Origin: AgroApp Parto module.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| madre_id | integer | NOT NULL, FK → animales.id RESTRICT | Mother animal |
| fecha | date | NOT NULL | |
| resultado | enum | NOT NULL | vivo / muerto / aborto / gemelar |
| cria_id | integer | nullable, FK → animales.id SET NULL | Offspring (if registered as animal) |
| tipo_ganado_cria_id | integer | nullable, FK → tipo_ganado.id SET NULL | |
| tipo_parto_id | integer | nullable, FK → tipo_parto.id SET NULL | |
| subtipo_parto_id | integer | nullable, FK → subtipo_parto.id SET NULL | |
| semen_id | integer | nullable, FK → semen.id SET NULL | |
| inseminador_id | integer | nullable, FK → inseminadores.id SET NULL | |
| numero_partos | integer | nullable | Parity number |
| observaciones | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

**Indexes:** `(madre_id, fecha)`, `(predio_id, fecha)`

### inseminaciones
Artificial insemination records. Origin: AgroApp Inseminacion module.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha | date | NOT NULL | |
| semen_id | integer | nullable, FK → semen.id SET NULL | |
| inseminador_id | integer | nullable, FK → inseminadores.id SET NULL | |
| resultado | enum | NOT NULL, default 'pendiente' | preñada / vacia / pendiente |
| observaciones | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### ecografias
Reproductive ultrasound records (pregnancy confirmation). Origin: AgroApp Ecografia.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha | date | NOT NULL | |
| resultado | enum | NOT NULL | preñada / vacia / dudosa |
| dias_gestacion | integer | nullable | |
| observaciones | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### areteos
DIIO/EID tag history. Origin: AgroApp Areteo (alta, aparición, cambio DIIO).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| tipo | enum | NOT NULL | alta / aparicion / cambio_diio |
| fecha | date | NOT NULL | |
| diio_nuevo | varchar(50) | NOT NULL | New tag assigned |
| diio_anterior | varchar(50) | nullable | Previous tag (null on initial alta) |
| observaciones | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### bajas
Animal loss records (death, forced sale, culling). Origin: AgroApp Baja.
Setting a baja updates animales.estado = 'baja'.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha | date | NOT NULL | |
| motivo_id | integer | NOT NULL, FK → baja_motivo.id RESTRICT | |
| causa_id | integer | nullable, FK → baja_causa.id SET NULL | |
| peso_kg | numeric(8,2) | nullable | |
| observaciones | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### tratamientos
Veterinary treatment records. Origin: AgroApp Tratamientos_Historial (AUT-298).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha | date | NOT NULL | |
| hora_registro | time | nullable | |
| id_agroapp | varchar(20) | nullable | AgroApp internal ID |
| diagnostico | varchar(300) | nullable | |
| observaciones | varchar(500) | nullable | |
| medicamentos | jsonb | nullable | Array of MedicamentoTratamiento (see schema) |
| inicio | date | nullable | Treatment start date |
| fin | date | nullable | Treatment end date |
| liberacion_carne_max | date | nullable | Denormalized max meat release date across all medicamentos |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

**Indexes:** `(animal_id, fecha)`, `(predio_id, fecha)`, `(diagnostico)`, `(liberacion_carne_max)`

### ventas
Sale records. Origin: AgroApp ventas ETL.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha | date | NOT NULL | |
| peso_kg | numeric(8,2) | nullable | Actual weight at sale |
| peso_estimado | numeric(8,2) | nullable | |
| venta_id_agroapp | integer | nullable | Groups animals sold together (rampa) |
| n_animales_rampa | integer | nullable | Total animals in the same rampa |
| destino | varchar(500) | nullable | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

### traslados
Official livestock transfers between predios/medierías. AUT-299.
animal_id is nullable — AgroApp exports aggregated by lot, not per-animal.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| animal_id | integer | nullable, FK → animales.id RESTRICT | Null for aggregated AgroApp imports |
| fecha | date | NOT NULL | |
| id_agroapp | varchar(20) | nullable | |
| predio_origen_id | integer | nullable, FK → predios.id SET NULL | |
| mediero_origen_id | integer | nullable, FK → medieros.id SET NULL | |
| fundo_origen_nombre | varchar(200) | nullable | Free text when no FK |
| predio_destino_id | integer | nullable, FK → predios.id SET NULL | |
| mediero_destino_id | integer | nullable, FK → medieros.id SET NULL | |
| fundo_destino_nombre | varchar(200) | nullable | Free text when no FK |
| n_animales | integer | nullable | Total animals in transfer |
| tipo_ganado_desglose | jsonb | nullable | {vaca: 19, vaquilla: 3} |
| n_guia | varchar(50) | nullable | SAG official transfer document number |
| estado | varchar(20) | nullable | Completo / Pendiente / etc. |
| observacion | varchar(500) | nullable | |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

---

## Layer 6 — Lotes (Feedlot Module)

### lotes
Feedlot lot. Groups animals with a weight goal. Only active when org.modulos.feedlot = true.
KPI: GDP = (peso_actual - peso_entrada) / días_en_lote.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| nombre | varchar(200) | NOT NULL | |
| fecha_entrada | date | NOT NULL | |
| fecha_salida_estimada | date | nullable | |
| objetivo_peso_kg | numeric(8,2) | nullable | Target exit weight |
| estado | varchar(50) | NOT NULL, default 'activo' | activo / cerrado |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

### lote_animales
Junction table: animals in lots. Records entry/exit and weights.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| lote_id | integer | NOT NULL, FK → lotes.id RESTRICT | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| fecha_entrada | date | NOT NULL | |
| fecha_salida | date | nullable | |
| peso_entrada_kg | numeric(8,2) | nullable | |
| peso_salida_kg | numeric(8,2) | nullable | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

---

## Layer 7 — Potreros (Crianza Module)

### potreros
Paddock/pasture subdivision of a predio. Only active when org.modulos.crianza = true.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| nombre | varchar(200) | NOT NULL | |
| hectareas | decimal(10,2) | nullable | |
| capacidad_animales | integer | nullable | |
| tipo | enum | nullable | pradera / cultivo / forestal / otro |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

### movimientos_potrero
Animal location history by paddock. Open record (fecha_salida IS NULL) = current location.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| animal_id | integer | NOT NULL, FK → animales.id RESTRICT | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| potrero_id | integer | NOT NULL, FK → potreros.id RESTRICT | |
| fecha_entrada | date | NOT NULL | |
| fecha_salida | date | nullable | NULL = currently here |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

---

## Layer 8 — Inventarios (schema only, not in prod DB)

### inventarios
Physical headcount snapshots. Origin: AgroApp Inventarios (27 historical rows). AUT-299.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| id_agroapp | varchar(20) | nullable | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| mediero_id | integer | nullable, FK → medieros.id SET NULL | For mediería inventory |
| fecha | date | NOT NULL | |
| n_encontrados | integer | nullable | |
| tg_encontrados | jsonb | nullable | {novillo: 10, vaca: 5} |
| n_faltantes | integer | nullable | |
| tg_faltantes | jsonb | nullable | |
| estado | varchar(20) | nullable | En Proceso / Completo |
| usuario_id | integer | nullable, FK → users.id SET NULL | |
| creado_en | timestamp tz | NOT NULL, defaultNow | |

---

## Layer 9 — Market Data

### precios_feria
Historical market price data. Sources: ODEPA, Tattersall. AUT-267. No FKs — standalone.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| fuente | text | NOT NULL | 'odepa' / 'tattersall' / 'liniers' |
| feria | text | NOT NULL | 'osorno' / 'temuco' / 'los_angeles' |
| categoria | text | NOT NULL | 'novillo_gordo' / 'vaca_gorda' / 'vaquilla' / 'ternero' / 'toro' |
| peso_rango | text | nullable | '400-500' / '500-600' |
| fecha | date | NOT NULL | |
| precio_kg_clp | numeric(10,2) | nullable | Price per kg in CLP |
| precio_cabeza_clp | numeric(12,2) | nullable | Price per head in CLP |
| moneda | text | NOT NULL, default 'CLP' | |
| url_fuente | text | nullable | Source URL |
| created_at | timestamp tz | NOT NULL, defaultNow | |

**Unique:** `(fuente, feria, categoria, peso_rango, fecha)`

---

## Layer 10 — Chat System

### conversaciones
Chat conversation history. Scoped per user. AUT-144.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| user_id | integer | NOT NULL, FK → users.id CASCADE | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| titulo | varchar(300) | NOT NULL | |
| mensajes | jsonb | NOT NULL, default [] | Array of {role, content} |
| creado_en | timestamp tz | NOT NULL, defaultNow | |
| actualizado_en | timestamp tz | NOT NULL, defaultNow | |

### chat_sessions
Chat session metadata (newer parallel table to conversaciones).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| user_id | integer | NOT NULL, FK → users.id CASCADE | |
| predio_id | integer | nullable, FK → predios.id RESTRICT | |
| titulo | text | NOT NULL | |
| created_at | timestamp tz | NOT NULL, defaultNow | |
| updated_at | timestamp tz | NOT NULL, defaultNow | |

### chat_attachments
PDF/doc files attached to chat sessions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| user_id | integer | NOT NULL, FK → users.id CASCADE | |
| predio_id | integer | NOT NULL, FK → predios.id RESTRICT | |
| session_id | integer | nullable, FK → chat_sessions.id SET NULL | |
| filename | text | NOT NULL | |
| mime_type | text | NOT NULL | |
| columnas | text[] | NOT NULL | Array of column names |
| contenido_json | jsonb | NOT NULL | Parsed file content |
| filas_count | integer | NOT NULL | |
| created_at | timestamp tz | NOT NULL, defaultNow | |

### chat_usage
Per-request LLM usage tracking. AUT-263. Retention: 365 days.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigserial | PK | |
| created_at | timestamp tz | NOT NULL, defaultNow | |
| org_id | integer | NOT NULL, FK → organizaciones.id NO ACTION | |
| user_id | integer | NOT NULL, FK → users.id NO ACTION | |
| session_id | text | nullable | String session identifier |
| predio_id | integer | nullable | No FK enforced |
| model_id | text | NOT NULL | e.g. 'claude-sonnet-4-6' |
| tier | text | NOT NULL | light / standard / heavy / trial |
| tokens_in | integer | NOT NULL | |
| tokens_out | integer | NOT NULL | |
| cache_read_tokens | integer | NOT NULL, default 0 | |
| cache_write_tokens | integer | NOT NULL, default 0 | |
| cost_usd | numeric(10,6) | NOT NULL | |
| tool_calls | integer | nullable, default 0 | |
| had_artifact | boolean | nullable, default false | |
| latency_ms | integer | nullable | |
| error | text | nullable | |

### chat_cache
Query response cache. AUT-265. TTL: 15/30/60 min. Invalidated on write events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | nullable | No FK enforced |
| user_id | integer | NOT NULL | No FK enforced |
| question_hash | text | NOT NULL | SHA-256 of (predio_id, normalized question) |
| question_text | text | NOT NULL | |
| response_text | text | NOT NULL | |
| artifact_json | jsonb | nullable | Cached artifact block |
| model_used | text | NOT NULL | |
| tokens_saved_estimate | integer | NOT NULL, default 0 | |
| hits | integer | NOT NULL, default 1 | Cache hit counter |
| created_at | timestamp tz | NOT NULL, defaultNow | |
| expires_at | timestamp tz | NOT NULL | |

### slash_commands
Global slash command definitions (not user-scoped).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| comando | text | NOT NULL, UNIQUE | e.g. '/partos_hoy' |
| label | text | NOT NULL | Display label |
| modulo | text | nullable | 'feedlot' / 'crianza' / null |
| prompt_template | text | NOT NULL | |
| orden | integer | NOT NULL, default 0 | Display order |

### user_tasks
AI-generated tasks for users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| user_id | integer | NOT NULL, FK → users.id CASCADE | Creator |
| org_id | integer | NOT NULL, FK → organizaciones.id RESTRICT | |
| titulo | text | NOT NULL | |
| asignado_a | integer | nullable, FK → users.id SET NULL | Assignee |
| estado | text | NOT NULL, default 'pendiente' | pendiente / completado |
| created_at | timestamp tz | NOT NULL, defaultNow | |
| due_at | timestamp tz | nullable | |

### user_memory
Persistent user memory for the chat assistant. AUT-270.
Key/value per user. Injected into system prompt on each request.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| user_id | integer | NOT NULL, FK → users.id CASCADE | |
| key | text | NOT NULL | snake_case |
| value | text | NOT NULL | |
| updated_at | timestamp tz | NOT NULL, defaultNow | |

**Unique:** `(user_id, key)`

### kb_documents
Knowledge base documents (PDFs indexed for chat). No enforced FK on predio_id.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PK | |
| predio_id | integer | NOT NULL | No FK enforced |
| nombre | text | NOT NULL | |
| mime_type | text | NOT NULL | |
| file_uri | text | NOT NULL | Google Files API URI |
| google_file_name | text | NOT NULL | |
| expires_at | timestamp | NOT NULL | Google Files API TTL |
| creado_en | timestamp | NOT NULL, defaultNow | |

---

## Enums

| Enum | Values |
|------|--------|
| sexo | M, H |
| estado_animal | activo, baja, desecho |
| modulo_animal | feedlot, crianza, ambos |
| rol | superadmin, admin_org, admin_fundo, operador, veterinario, viewer, trial |
| tipo_propiedad | propio, medieria |
| tipo_negocio | medieria, hoteleria |
| tipo_proveedor | feria, criador, intermediario, desconocido |
| tipo_tenencia | propio, arriendo |
| resultado_parto | vivo, muerto, aborto, gemelar |
| resultado_inseminacion | preñada, vacia, pendiente |
| resultado_ecografia | preñada, vacia, dudosa |
| tipo_areteo | alta, aparicion, cambio_diio |
| tipo_potrero | pradera, cultivo, forestal, otro |

---

## Schema vs Prod DB drift

| Table | In Schema | In Prod DB |
|-------|-----------|------------|
| inventarios | ✅ | ❌ — not migrated yet |
| proveedores | ✅ | ❌ — not migrated yet |
| All others | ✅ | ✅ |
