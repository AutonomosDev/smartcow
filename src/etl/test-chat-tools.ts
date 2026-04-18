/**
 * Test directo de las tools del chat ganadero (sin pasar por HTTP).
 */
import { ejecutarTool } from "../lib/claude";

const PREDIO_ID = 9; // San Pedro

async function main() {
  console.log("=== query_historial_animal (DIIO 26925598 / Medieria FT) ===\n");
  const hist = await ejecutarTool(
    "query_historial_animal",
    { predio_id: 5, diio: "26925598" }, // Medieria FT = 5
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    1,
    3
  );
  console.log(JSON.stringify(hist, null, 2).slice(0, 1500));

  console.log("\n\n=== query_indices_reproductivos (San Pedro) ===\n");
  const indices = await ejecutarTool(
    "query_indices_reproductivos",
    { predio_id: PREDIO_ID },
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    1,
    3
  );
  console.log(JSON.stringify(indices, null, 2));

  console.log("\n\n=== query_partos (San Pedro 2024) ===\n");
  const ptos = await ejecutarTool(
    "query_partos",
    { predio_id: PREDIO_ID, rango_fechas: { inicio: "2024-01-01", fin: "2024-12-31" }, limite: 5 },
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    1,
    3
  );
  const p = ptos as { total: number };
  console.log(`Total partos San Pedro 2024: ${p.total}`);

  console.log("\n\n=== query_toros (ranking) ===\n");
  const toros = await ejecutarTool(
    "query_toros",
    { predio_id: PREDIO_ID, limite: 5 },
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    1,
    3
  );
  console.log(JSON.stringify(toros, null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
