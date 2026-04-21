/**
 * src/etl/seed-staging.ts — Seed sintético para la DB de staging.
 * NO usar en prod. NO copia PII. NO toca AgroApp.
 *
 * Uso (desde el host del VPS):
 *   DATABASE_URL=$DATABASE_URL_STAGING npx tsx src/etl/seed-staging.ts
 *
 * Idempotente: re-correrlo borra y recrea el dataset mínimo.
 */

import { db } from "@/src/db/client";
import {
  organizaciones,
  predios,
  users,
  userPredios,
  animales,
  tipoGanado,
} from "@/src/db/schema/index";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  console.log("[seed-staging] reset…");
  await db.execute(sql`
    TRUNCATE TABLE
      animales, user_predios, users, predios, organizaciones
    RESTART IDENTITY CASCADE
  `);

  console.log("[seed-staging] catálogo tipo_ganado…");
  let [tipoVaca] = await db
    .select()
    .from(tipoGanado)
    .where(eq(tipoGanado.nombre, "Vaca"));
  if (!tipoVaca) {
    [tipoVaca] = await db
      .insert(tipoGanado)
      .values({ nombre: "Vaca" })
      .returning();
  }

  console.log("[seed-staging] organización…");
  const [org] = await db
    .insert(organizaciones)
    .values({
      nombre: "Predio Demo Staging",
      rut: "76.000.000-0",
      plan: "pro",
      modulos: { feedlot: true, crianza: true },
    })
    .returning();

  console.log("[seed-staging] predio…");
  const [predio] = await db
    .insert(predios)
    .values({
      orgId: org.id,
      nombre: "Fundo Demo",
      region: "Los Lagos",
    })
    .returning();

  console.log("[seed-staging] user admin…");
  const pwHash = await bcrypt.hash("staging123", 10);
  const [user] = await db
    .insert(users)
    .values({
      email: "admin@staging.smartcow.cl",
      nombre: "Admin Staging",
      passwordHash: pwHash,
      orgId: org.id,
      rol: "admin_org",
    })
    .returning();

  await db.insert(userPredios).values({
    userId: user.id,
    predioId: predio.id,
    rol: "admin_org",
  });

  console.log("[seed-staging] 3 animales…");
  await db.insert(animales).values([
    {
      predioId: predio.id,
      tipoGanadoId: tipoVaca.id,
      diio: "STG-001",
      eid: "982000000000001",
      sexo: "H",
      fechaNacimiento: "2023-06-01",
      estado: "activo",
    },
    {
      predioId: predio.id,
      tipoGanadoId: tipoVaca.id,
      diio: "STG-002",
      eid: "982000000000002",
      sexo: "M",
      fechaNacimiento: "2023-07-15",
      estado: "activo",
    },
    {
      predioId: predio.id,
      tipoGanadoId: tipoVaca.id,
      diio: "STG-003",
      eid: "982000000000003",
      sexo: "H",
      fechaNacimiento: "2024-01-10",
      estado: "activo",
    },
  ]);

  console.log("[seed-staging] done. login: admin@staging.smartcow.cl / staging123");
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed-staging] error:", e);
  process.exit(1);
});
