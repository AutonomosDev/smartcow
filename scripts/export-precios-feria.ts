/**
 * scripts/export-precios-feria.ts
 * Dump completo de precios_feria a CSV en docs/data/.
 *
 * Ticket: AUT-267
 * Uso: tsx scripts/export-precios-feria.ts
 */

import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const result = await db.execute(sql`
    SELECT fuente, feria, categoria, peso_rango, fecha,
           precio_kg_clp, precio_cabeza_clp, moneda, url_fuente, created_at
    FROM precios_feria
    ORDER BY fecha DESC, feria, categoria
  `);

  const rows = result.rows as Array<Record<string, unknown>>;

  const header = [
    "fuente",
    "feria",
    "categoria",
    "peso_rango",
    "fecha",
    "precio_kg_clp",
    "precio_cabeza_clp",
    "moneda",
    "url_fuente",
    "created_at",
  ];

  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    header.join(","),
    ...rows.map((r) => header.map((h) => escape(r[h])).join(",")),
  ];

  const today = new Date().toISOString().slice(0, 10);
  const outDir = join(process.cwd(), "docs", "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `precios-feria-${today}.csv`);
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

  console.log(`✓ Exportadas ${rows.length} filas → ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[export] error:", err);
  process.exit(1);
});
