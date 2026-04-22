/**
 * scripts/seed-agroapp-predios-medieros.ts
 *
 * AUT-296 (W1) — Paso 3: seed idempotente de predios + medieros reales
 * para Agrícola Los Lagos (org 1) según clasificación manual de Cesar.
 *
 * Se corre UNA vez contra prod/staging tras aplicar migration 0021.
 * Idempotente: upsert por (org_id, nombre). Re-correrlo no duplica.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx scripts/seed-agroapp-predios-medieros.ts
 *   DATABASE_URL=... npx tsx scripts/seed-agroapp-predios-medieros.ts --org-id 1
 *
 * Salida: tabla con los IDs resultantes (predios + medieros), útil para
 * los ETL de W2..W5 que necesitan mapear nombres AgroApp → IDs SmartCow.
 *
 * Read-heavy + INSERT/UPDATE puntual. No TRUNCATE. No toca otros datos.
 */

import { db } from "@/src/db/client";
import {
  predios,
  medieros,
  organizaciones,
  proveedores,
} from "@/src/db/schema/index";
import {
  PREDIOS_SEED,
  MEDIEROS_SEED,
  PROVEEDORES_SEED,
} from "@/src/etl/fundo-resolver";
import { and, eq } from "drizzle-orm";

function parseArgs(argv: string[]): { orgId: number } {
  const idx = argv.indexOf("--org-id");
  const orgId = idx >= 0 ? Number(argv[idx + 1]) : 1;
  if (!Number.isInteger(orgId) || orgId <= 0) {
    throw new Error(`--org-id inválido: ${argv[idx + 1]}`);
  }
  return { orgId };
}

async function main() {
  const { orgId } = parseArgs(process.argv.slice(2));

  console.log(`[seed] AUT-296 — org_id=${orgId}`);

  // 1) Verificar que la org existe
  const [org] = await db
    .select()
    .from(organizaciones)
    .where(eq(organizaciones.id, orgId));
  if (!org) {
    throw new Error(`org_id=${orgId} no existe. Abortando.`);
  }
  console.log(`[seed] organización: ${org.nombre} (id=${org.id})`);

  // 2) Upsert predios
  console.log(`\n[seed] predios (${PREDIOS_SEED.length})`);
  const predioIdByNombre: Record<string, number> = {};
  for (const p of PREDIOS_SEED) {
    const [existing] = await db
      .select()
      .from(predios)
      .where(and(eq(predios.orgId, orgId), eq(predios.nombre, p.nombre)));

    if (existing) {
      // update tipo_tenencia si cambió
      if (existing.tipoTenencia !== p.tipoTenencia) {
        await db
          .update(predios)
          .set({ tipoTenencia: p.tipoTenencia })
          .where(eq(predios.id, existing.id));
        console.log(
          `  [upd] ${p.nombre.padEnd(30)} id=${existing.id} tenencia=${p.tipoTenencia}`
        );
      } else {
        console.log(
          `  [ok ] ${p.nombre.padEnd(30)} id=${existing.id} tenencia=${p.tipoTenencia}`
        );
      }
      predioIdByNombre[p.nombre] = existing.id;
    } else {
      const [created] = await db
        .insert(predios)
        .values({
          orgId,
          nombre: p.nombre,
          region: "Los Lagos",
          tipoTenencia: p.tipoTenencia,
        })
        .returning();
      console.log(
        `  [new] ${p.nombre.padEnd(30)} id=${created.id} tenencia=${p.tipoTenencia}`
      );
      predioIdByNombre[p.nombre] = created.id;
    }
  }

  // 3) Upsert medieros/hoteleros
  console.log(`\n[seed] medieros (${MEDIEROS_SEED.length})`);
  for (const m of MEDIEROS_SEED) {
    const predioId = predioIdByNombre[m.predioNombre];
    if (!predioId) {
      console.error(
        `  [err] ${m.nombre}: predio "${m.predioNombre}" no está seedeado. Skip.`
      );
      continue;
    }

    const [existing] = await db
      .select()
      .from(medieros)
      .where(and(eq(medieros.orgId, orgId), eq(medieros.nombre, m.nombre)));

    if (existing) {
      const needsUpdate =
        existing.tipoNegocio !== m.tipoNegocio || existing.predioId !== predioId;
      if (needsUpdate) {
        await db
          .update(medieros)
          .set({ tipoNegocio: m.tipoNegocio, predioId })
          .where(eq(medieros.id, existing.id));
        console.log(
          `  [upd] ${m.nombre.padEnd(22)} id=${existing.id} tipo=${m.tipoNegocio} predio=${m.predioNombre}`
        );
      } else {
        console.log(
          `  [ok ] ${m.nombre.padEnd(22)} id=${existing.id} tipo=${m.tipoNegocio} predio=${m.predioNombre}`
        );
      }
    } else {
      const [created] = await db
        .insert(medieros)
        .values({
          orgId,
          predioId,
          nombre: m.nombre,
          tipoNegocio: m.tipoNegocio,
          activo: true,
        })
        .returning();
      console.log(
        `  [new] ${m.nombre.padEnd(22)} id=${created.id} tipo=${m.tipoNegocio} predio=${m.predioNombre}`
      );
    }
  }

  // 4) Upsert proveedores (origen comercial del ganado — ferias, criadores)
  console.log(`\n[seed] proveedores (${PROVEEDORES_SEED.length})`);
  for (const pv of PROVEEDORES_SEED) {
    const [existing] = await db
      .select()
      .from(proveedores)
      .where(and(eq(proveedores.orgId, orgId), eq(proveedores.nombre, pv.nombre)));

    if (existing) {
      if (existing.tipo !== pv.tipo) {
        await db
          .update(proveedores)
          .set({ tipo: pv.tipo })
          .where(eq(proveedores.id, existing.id));
        console.log(`  [upd] ${pv.nombre.padEnd(28)} id=${existing.id} tipo=${pv.tipo}`);
      } else {
        console.log(`  [ok ] ${pv.nombre.padEnd(28)} id=${existing.id} tipo=${pv.tipo}`);
      }
    } else {
      const [created] = await db
        .insert(proveedores)
        .values({ orgId, nombre: pv.nombre, tipo: pv.tipo, activo: true })
        .returning();
      console.log(`  [new] ${pv.nombre.padEnd(28)} id=${created.id} tipo=${pv.tipo}`);
    }
  }

  // 5) Tabla final
  console.log(`\n=== RESULTADO ===\n`);
  const finalPredios = await db
    .select()
    .from(predios)
    .where(eq(predios.orgId, orgId));
  const finalMedieros = await db
    .select()
    .from(medieros)
    .where(eq(medieros.orgId, orgId));
  const finalProveedores = await db
    .select()
    .from(proveedores)
    .where(eq(proveedores.orgId, orgId));

  console.log("PREDIOS:");
  for (const p of finalPredios) {
    console.log(`  id=${String(p.id).padStart(3)}  ${p.nombre.padEnd(30)}  ${p.tipoTenencia}`);
  }
  console.log("\nMEDIEROS:");
  for (const m of finalMedieros) {
    console.log(
      `  id=${String(m.id).padStart(3)}  ${m.nombre.padEnd(22)}  ${m.tipoNegocio}  predio_id=${m.predioId}`
    );
  }
  console.log("\nPROVEEDORES:");
  const byTipo: Record<string, number> = {};
  for (const pv of finalProveedores) {
    console.log(`  id=${String(pv.id).padStart(3)}  ${pv.nombre.padEnd(28)}  ${pv.tipo}`);
    byTipo[pv.tipo] = (byTipo[pv.tipo] ?? 0) + 1;
  }
  console.log(`\n  Resumen proveedores: ${JSON.stringify(byTipo)}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
