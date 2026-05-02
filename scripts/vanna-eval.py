#!/usr/bin/env python3
"""
scripts/vanna-eval.py — Vanna 2.0 + Gemma 4 e4b local + smartcow_local.

Approach simplificado: SystemPromptBuilder custom con schema + glosario +
ejemplos hardcoded (sin ChromaDB) + RunSqlTool con PostgresRunner.

Demo de la idea: el agente NO entrena, solo lee el system prompt rico
y genera SQL → ejecuta contra postgres → devuelve resultado.

Uso:
  .venv-vanna/bin/python scripts/vanna-eval.py
"""

import asyncio
import os
import sys
import time
from pathlib import Path
from typing import List, Optional

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
os.chdir(REPO)


SYSTEM_PROMPT = """<|think|>
Sos asistente ganadero SmartCow Chile, productor de carne bovina.
Generás SQL **PostgreSQL** (NO SQLite, NO MySQL) contra smartcow_local.

═══ DIALECTO OBLIGATORIO POSTGRESQL ═══

USAR:
  CURRENT_DATE - INTERVAL '60 days'        ✓
  date_trunc('month', fecha)               ✓
  EXTRACT(YEAR FROM fecha)                 ✓
  COALESCE, NULLIF                         ✓
  string_agg, array_agg                    ✓

PROHIBIDO:
  date('now', '-60 days')        ✗ SQLite
  DATEADD(...)                   ✗ SQL Server
  DATE_SUB(...)                  ✗ MySQL
  IIF(...)                       ✗
  TOP N (usar LIMIT N)           ✗

═══ SCHEMA smartcow_local — 14 TABLAS REALES ═══

TABLA holdings  (1 fila)
  id, org_id, nombre
  → Agrícola Los Lagos (id=1)

TABLA predios  (2 filas, fijos)
  id, org_id, nombre, region, holding_id, tipo_tenencia
  → id=1 'Agrícola'  (etapa crianza)
  → id=2 'Feedlot'   (etapas recria + engorda)

TABLA animales  (2.636 filas)
  id (PK), predio_id (FK), diio, eid,
  tipo_ganado_id (FK), raza_id (FK),
  sexo enum('H','M'),
  fecha_nacimiento, estado_reproductivo_id (FK),
  estado enum('activo','baja','desecho'),
  diio_madre, padre, abuelo, origen,
  etapa varchar('crianza','recria','engorda')

TABLA pesajes  (6.309 filas)
  id, animal_id (FK), predio_id (FK),
  peso_kg numeric, fecha, edad_meses,
  outlier_peso bool   -- true si peso < 10kg
  outlier_edad bool   -- true si edad > 300 meses
  observaciones, dispositivo, es_peso_llegada
  UNIQUE (animal_id, fecha, peso_kg)

TABLA partos  (4.680 filas)
  id, predio_id, madre_id (FK animales),
  fecha, resultado enum('vivo','muerto','aborto','gemelar'),
  cria_id (FK animales nullable),
  tipo_ganado_cria_id, tipo_parto_id, subtipo_parto_id,
  semen_id, inseminador_id, numero_partos, observaciones

TABLA inseminaciones  (4.368 filas)
  id, predio_id, animal_id (FK),
  fecha, semen_id, inseminador_id,
  resultado enum('preñada','vacia','pendiente'),
  observaciones

TABLA tratamientos  (25.598 filas)
  id, predio_id, animal_id (FK),
  fecha, hora_registro, id_agroapp,
  diagnostico varchar       -- ej 'piojos','desparacitacion','vacunacion'
  observaciones,
  medicamentos jsonb        -- [{nombre, via, resguardo_carne_dias, resguardo_leche_dias}]
  inicio, fin, liberacion_carne_max

TABLA bajas  (1 fila — la mayoría son históricas, no pobladas)
  id, predio_id, animal_id (FK),
  fecha, motivo_id (FK baja_motivo), causa_id,
  peso_kg, observaciones
  → Side effect: animales.estado='baja' cuando hay baja

TABLA baja_motivo  (catálogo, 29 motivos)
  id, nombre   -- ej 'Muerte','Abigeato','Neumonia','Diarrea',...

TABLA ventas  (846 filas)
  id, predio_id, animal_id (FK NULLABLE — puede ser NULL si lote),
  fecha, peso_kg, peso_estimado, n_animales_rampa,
  destino varchar         -- ej 'Tattersall Coyhaique','Fegosa Pto Montt'
  animales_lote jsonb     -- {tipo_ganado: count} cuando es lote
  → 91% ventas son por lote (animal_id IS NULL, animales_lote populated)

TABLA traslados  (198 filas)
  id, animal_id (FK NULLABLE), fecha, id_agroapp,
  predio_origen_id, predio_destino_id,
  fundo_origen_nombre, fundo_destino_nombre,
  n_animales, tipo_ganado_desglose jsonb,
  n_guia, estado, observacion

TABLA inventarios  (27 filas)
  id, predio_id, fecha, n_encontrados, tg_encontrados jsonb,
  n_faltantes, tg_faltantes jsonb,
  estado, id_agroapp

TABLA precios_feria  (35.178 filas)
  id, fuente, feria, categoria, peso_rango,
  fecha, precio_kg_clp, precio_cabeza_clp, moneda
  → datos externos ODEPA/AFECH, sin FK al holding

TABLA kpi_diario  (snapshot diario por predio)
  id, fecha, predio_id (FK),
  total_animales, vacas_prenadas, vacas_vacias,
  animales_listos_venta,
  peso_promedio_engorda numeric,
  peso_promedio_recria numeric,
  pesajes_dia, outliers_detectados, animales_sin_pesaje_60d
  UNIQUE (fecha, predio_id)

═══ CATÁLOGOS ═══

tipo_ganado: 1=Vaca, 2=Novillo, 3=Toro, 4=Ternero, 5=Vaquilla, 6=Ternera

estado_reproductivo: catalogo (Preñada, Vacía, Parida, Inseminada,
                              Preencaste, etc)

═══ MAPEO ESPAÑOL → COLUMNA EXACTA ═══

"diagnóstico"           → tratamientos.diagnostico (ES, NO 'diagnosis')
"motivo de baja"        → bajas.motivo_id JOIN baja_motivo.nombre
"destino venta"         → ventas.destino
"lugar"/"feria/comprador" → ventas.destino
"a quién se vendió"     → ventas.destino
"medicamento"           → tratamientos.medicamentos->>'nombre' (jsonb path)
"resguardo carne"       → tratamientos.medicamentos->>'resguardo_carne_dias'
"resguardo leche"       → tratamientos.medicamentos->>'resguardo_leche_dias'
"toro padre"            → animales.padre (string libre)
"madre"                 → animales.diio_madre (string)
"último pesaje"         → DISTINCT ON (animal_id) ORDER BY fecha DESC
"vacas preñadas"        → estado_reproductivo.nombre ILIKE '%pren%'
"vacas vacías"          → estado_reproductivo.nombre ILIKE '%vac%'
"venta por lote"        → ventas.animal_id IS NULL AND animales_lote IS NOT NULL
"venta individual"      → ventas.animal_id IS NOT NULL

═══ GLOSARIO GANADERÍA CHILE ═══

ETAPAS:
- crianza: vaca-ternero (0-200 kg, en Agrícola)
- recria:  200-400 kg (en Feedlot)
- engorda: 400-550 kg (en Feedlot, terminación venta)

CATEGORÍAS (tipo_ganado.nombre):
- Vaca:     hembra adulta con ≥1 parto
- Vaquilla: hembra joven sin parir o primera gestación
- Ternera:  hembra <12 meses
- Toro:     macho reproductor entero
- Novillo:  macho castrado >12 meses (engorda)
- Ternero:  macho <12 meses

KPIs benchmark:
- Tasa preñez:  óptima >75%, crítica <60%
- Mortalidad:   óptima <2%
- Peso venta:   480-550 kg novillo terminado
- GDP feedlot:  meta 1.2-1.5 kg/día

═══ INSTRUCCIONES SQL ═══

1. SIEMPRE generá PostgreSQL. Verificá que NO uses date('now',...).
2. NUNCA inventes columnas. Solo las del schema arriba.
3. Para listados: LIMIT 100 max.
4. Para promedios de peso: filtrá outlier_peso=false.
5. Para "último pesaje por animal": DISTINCT ON.
6. Para fechas relativas: CURRENT_DATE - INTERVAL 'X days/months'.
7. Si la pregunta es por user_id/predio_id, filtrá animales/pesajes
   por predio_id correspondiente.

═══ EJEMPLOS por TABLA ═══

P: "¿cuántas vacas?"
SQL: SELECT COUNT(*) FROM animales a JOIN tipo_ganado tg ON tg.id=a.tipo_ganado_id
     WHERE tg.nombre='Vaca' AND a.estado='activo' AND a.predio_id=1;

P: "top 5 diagnósticos más comunes en tratamientos"
SQL: SELECT diagnostico, COUNT(*) AS n FROM tratamientos
     WHERE diagnostico IS NOT NULL AND predio_id=1
     GROUP BY diagnostico ORDER BY n DESC LIMIT 5;

P: "animales sin pesar últimos 60 días"
SQL: SELECT a.diio FROM animales a
     WHERE a.predio_id=2 AND a.estado='activo'
     AND NOT EXISTS (SELECT 1 FROM pesajes p
                     WHERE p.animal_id=a.id
                     AND p.fecha >= CURRENT_DATE - INTERVAL '60 days')
     LIMIT 100;

P: "ventas por destino últimos 6 meses"
SQL: SELECT destino, COUNT(*) AS n_ventas, SUM(n_animales_rampa) AS animales
     FROM ventas
     WHERE predio_id=1 AND fecha >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY destino ORDER BY n_ventas DESC LIMIT 20;

P: "motivo más común de bajas"
SQL: SELECT bm.nombre, COUNT(*) AS n FROM bajas b
     JOIN baja_motivo bm ON bm.id=b.motivo_id
     WHERE b.predio_id=1
     GROUP BY bm.nombre ORDER BY n DESC LIMIT 5;

P: "tasa de preñez actual"
SQL: SELECT
       COUNT(*) FILTER (WHERE er.nombre ILIKE '%pren%') AS prenadas,
       COUNT(*) FILTER (WHERE er.nombre ILIKE '%vac%')  AS vacias,
       COUNT(*) AS total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE er.nombre ILIKE '%pren%')
             / NULLIF(COUNT(*), 0), 1) AS pct_prenez
     FROM animales a
     JOIN tipo_ganado tg ON tg.id=a.tipo_ganado_id
     LEFT JOIN estado_reproductivo er ON er.id=a.estado_reproductivo_id
     WHERE a.predio_id=1 AND a.estado='activo' AND tg.nombre IN ('Vaca','Vaquilla');

P: "ventas por lote vs individual"
SQL: SELECT
       CASE WHEN animal_id IS NULL THEN 'lote' ELSE 'individual' END AS tipo,
       COUNT(*) AS n
     FROM ventas WHERE predio_id=1
     GROUP BY tipo;

P: "peso promedio engorda en feedlot"
SQL: WITH ult AS (
       SELECT DISTINCT ON (animal_id) animal_id, peso_kg
       FROM pesajes WHERE outlier_peso=false ORDER BY animal_id, fecha DESC
     )
     SELECT ROUND(AVG(u.peso_kg)::numeric, 1) AS peso_avg
     FROM animales a JOIN ult u ON u.animal_id=a.id
     WHERE a.etapa='engorda' AND a.predio_id=2;

P: "animales listos para venta (>450kg en engorda)"
SQL: WITH ult AS (
       SELECT DISTINCT ON (animal_id) animal_id, peso_kg
       FROM pesajes WHERE outlier_peso=false ORDER BY animal_id, fecha DESC
     )
     SELECT a.diio, u.peso_kg
     FROM animales a JOIN ult u ON u.animal_id=a.id
     WHERE a.etapa='engorda' AND a.predio_id=2 AND a.estado='activo'
       AND u.peso_kg > 450
     ORDER BY u.peso_kg DESC LIMIT 50;

P: "tratamientos con resguardo carne activo"
SQL: SELECT t.id, a.diio, t.diagnostico,
       (t.medicamentos->0->>'resguardo_carne_dias')::int AS dias,
       t.fecha
     FROM tratamientos t JOIN animales a ON a.id=t.animal_id
     WHERE t.predio_id=1
       AND t.fecha + ((t.medicamentos->0->>'resguardo_carne_dias')::int) >= CURRENT_DATE
     LIMIT 50;
"""


async def main():
    from vanna import Agent, AgentConfig, User
    from vanna.core.registry import ToolRegistry
    from vanna.core.user import RequestContext, UserResolver
    from vanna.core.system_prompt import SystemPromptBuilder
    from vanna.integrations.ollama import OllamaLlmService
    from vanna.integrations.postgres import PostgresRunner
    from vanna.integrations.chromadb import ChromaAgentMemory
    from vanna.tools import RunSqlTool, VisualizeDataTool, LocalFileSystem

    class FixedUserResolver(UserResolver):
        async def resolve_user(self, request_context):
            return User(id="cesar", username="cesar", email="cesar@autonomos.dev")

    class SmartCowPromptBuilder(SystemPromptBuilder):
        async def build_system_prompt(self, user, tools):
            tool_lines = "\n".join(f"- {t.name}: {t.description}" for t in tools)
            return SYSTEM_PROMPT + f"\n\n═══ TOOLS DISPONIBLES ═══\n{tool_lines}"

    print("→ LLM: Ollama gemma4:latest (local)")
    llm = OllamaLlmService(
        model="gemma4:latest",
        host="http://127.0.0.1:11434",
        num_ctx=8192,
        temperature=0.3,
        top_p=0.9,
    )

    print("→ DB: smartcow_local")
    pg_runner = PostgresRunner(
        host="127.0.0.1",
        port=5432,
        database="smartcow_local",
        user="postgres",
    )

    print("→ Tools: RunSqlTool + VisualizeDataTool")
    file_system = LocalFileSystem(working_directory="/tmp/vanna_smartcow_data")
    tool_registry = ToolRegistry()
    sql_tool = RunSqlTool(sql_runner=pg_runner, file_system=file_system)
    tool_registry.register_local_tool(sql_tool, access_groups=["admin", "user"])
    try:
        viz_tool = VisualizeDataTool(file_system=file_system)
        tool_registry.register_local_tool(viz_tool, access_groups=["admin", "user"])
        print("   ✓ Visualization tool enabled")
    except Exception as e:
        print(f"   ⚠ visualization disabled: {e}")

    user_resolver = FixedUserResolver()
    prompt_builder = SmartCowPromptBuilder()
    agent_memory = ChromaAgentMemory(
        persist_directory="/tmp/chroma_smartcow_eval",
        collection_name="smartcow_eval",
    )

    agent = Agent(
        llm_service=llm,
        config=AgentConfig(stream_responses=False, max_tool_iterations=5),
        tool_registry=tool_registry,
        user_resolver=user_resolver,
        agent_memory=agent_memory,
        system_prompt_builder=prompt_builder,
    )

    test_questions = [
        # Análisis simples baseline
        "¿Cuántos animales tengo?",
        "Top 5 más pesados, mostrame en una tabla",
        # Razonamiento complejo (multi-step, joins, agregaciones)
        "¿Hay diferencias de GDP entre cohortes 2024, 2025 y 2026? Compará en una tabla.",
        "¿Qué toro produjo los novillos con mejor peso promedio? Top 5 en tabla.",
        "Listame las 10 vacas con más partos y mostrá el peso promedio de su descendencia.",
        "¿Cuántos animales subieron más de 100 kg entre su primer y último pesaje? Tabla con DIIO y kg ganados.",
        "Compará animales con origen externo (compras) vs criados acá: cuántos hay y peso promedio actual de cada grupo.",
        "Hallá hijos del toro RAMESSES y dame su peso promedio actual vs el promedio del rebaño en su misma etapa.",
        "Vacas vacías (estado_reproductivo=Vacía) que tengan más de 5 años — listalas con DIIO y edad.",
        "¿Qué % del rebaño está atrasado en peso comparado con su categoría? (categorías por edad: ternero <12m, recría 12-24m, engorda >24m)",
        "Animales con pesajes sospechosos: que perdieron más de 50kg entre dos pesajes consecutivos. Listame.",
        "Tabla resumen del feedlot: total animales, peso promedio, cuántos >550kg, cuántos sin pesaje en 30 días.",
        "Vacas con descendencia inferior al promedio del rebaño: cuántas son y darme las top 10 peores.",
        "¿Cuál es la edad promedio del rebaño por categoría? Tabla con tipo, edad_meses promedio, edad min, edad max.",
        "Hacé un análisis general del estado del rebaño: total, distribución por etapa, promedio peso engorda, % preñez si hay datos.",
    ]

    print(f"\n{'='*70}")
    print(f"VANNA 2.0 + GEMMA 4 e4b LOCAL · {len(test_questions)} preguntas")
    print(f"{'='*70}")

    request_context = RequestContext(cookies={}, metadata={"eval": True}, remote_addr="127.0.0.1")
    conversation_id = "vanna-eval-001"

    results = []
    for i, q in enumerate(test_questions, 1):
        print(f"\n[Q{i:02d}] {q}")
        t0 = time.time()
        components = []
        try:
            async for component in agent.send_message(
                request_context=request_context,
                message=q,
                conversation_id=conversation_id,
            ):
                components.append(component)
        except Exception as e:
            print(f"   [error] {type(e).__name__}: {str(e)[:300]}")
            components = []
        elapsed = time.time() - t0
        results.append({"q": q, "components": len(components), "elapsed": elapsed})
        # Dump de cada componente: extraer SQL + resultados + texto + tabla
        sql_executed = None
        sql_result_rows = None
        text_response = None
        artifacts = []
        for j, c in enumerate(components):
            try:
                data = c.model_dump() if hasattr(c, "model_dump") else dict(c)
            except Exception:
                continue
            simple = data.get("simple_component", {}) or {}
            rich = data.get("rich_component", {}) or {}
            # Buscar SQL en cualquier campo
            for src in (simple, rich, data):
                for k in ("text", "content", "markdown_content", "code"):
                    val = src.get(k) if isinstance(src, dict) else None
                    if val and isinstance(val, str):
                        if val.upper().startswith("SELECT") or "FROM" in val.upper()[:200]:
                            sql_executed = val[:500]
                        elif text_response is None and len(val) > 5:
                            text_response = val[:300]
            # DataFrame / tabla
            if data.get("data_frame") or rich.get("data_frame"):
                df = data.get("data_frame") or rich.get("data_frame")
                if isinstance(df, dict):
                    rows = df.get("rows") or df.get("data")
                    if rows: sql_result_rows = rows[:5]
            # Tool result
            if rich.get("type") == "tool_result" or data.get("type") == "tool_result":
                artifacts.append("tool_result")
            # Visualization
            if rich.get("type") == "chart" or "html" in (rich or {}):
                artifacts.append("chart")

        if sql_executed:
            print(f"   SQL: {sql_executed[:200]}{'...' if len(sql_executed)>200 else ''}")
        if sql_result_rows:
            print(f"   ROWS: {sql_result_rows}")
        if text_response:
            print(f"   R: {text_response}")
        if artifacts:
            print(f"   artifacts: {artifacts}")
        print(f"   {elapsed:.1f}s · {len(components)} componentes")

    print(f"\n{'='*70}")
    print("RESUMEN")
    print(f"{'='*70}")
    print(f"Preguntas: {len(results)}")
    print(f"Tiempo total: {sum(r['elapsed'] for r in results):.1f}s")
    print(f"Latencia avg: {sum(r['elapsed'] for r in results)/len(results):.1f}s")
    print(f"Sin componentes: {sum(1 for r in results if r['components']==0)}/{len(results)}")


if __name__ == "__main__":
    asyncio.run(main())
