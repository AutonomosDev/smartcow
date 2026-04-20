/**
 * src/etl/create-users-prod.ts — Crear/actualizar los 5 usuarios iniciales en prod.
 *
 * Idempotente. No hace TRUNCATE. No crea predios ni animales.
 * Org "JP Ferrada" se crea si no existe.
 *
 * Uso (en el VPS, dentro del container app):
 *   docker compose exec app npx tsx src/etl/create-users-prod.ts
 *
 * O con dry-run:
 *   docker compose exec app npx tsx src/etl/create-users-prod.ts --dry-run
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { organizaciones } from "../db/schema/organizaciones.js";
import { users } from "../db/schema/users.js";

const DRY_RUN = process.argv.includes("--dry-run");

const USUARIOS = [
  { email: "jferrada@sevillainversiones.cl", nombre: "Juan Pablo Ferrada", password: "JP2026!", rol: "admin_org" as const },
  { email: "renato@smartcow.cl",             nombre: "Renato",              password: "Renato2026!",  rol: "admin_org" as const },
  { email: "tamara@autonomos.dev",           nombre: "Tamara",              password: "Tamara2026!",  rol: "admin_org" as const },
  { email: "jaime@smartcow.cl",              nombre: "Jaime",               password: "Jaime2026!",   rol: "admin_org" as const },
  { email: "claudio@autonomos.dev",          nombre: "Claudio",             password: "Claudio2026!", rol: "admin_org" as const },
];

const ORG_NOMBRE = "JP Ferrada";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: { organizaciones, users } });

  console.log(`[create-users-prod] start ${DRY_RUN ? "(DRY-RUN)" : ""}`);

  // 1. Upsert org
  const existingOrg = await db.select().from(organizaciones).where(eq(organizaciones.nombre, ORG_NOMBRE)).limit(1);

  let orgId: number;
  if (existingOrg.length > 0) {
    orgId = existingOrg[0].id;
    console.log(`[create-users-prod] org "${ORG_NOMBRE}" ya existe (id=${orgId})`);
  } else {
    if (DRY_RUN) {
      console.log(`[create-users-prod] (dry) crearía org "${ORG_NOMBRE}"`);
      orgId = -1;
    } else {
      const [created] = await db
        .insert(organizaciones)
        .values({ nombre: ORG_NOMBRE, plan: "pro", modulos: { feedlot: true, crianza: true } })
        .returning({ id: organizaciones.id });
      orgId = created.id;
      console.log(`[create-users-prod] org "${ORG_NOMBRE}" creada (id=${orgId})`);
    }
  }

  // 2. Upsert usuarios
  let created = 0;
  let updated = 0;
  let warnings = 0;

  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.password, 10);
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      if (current.rol !== u.rol) {
        console.warn(`[create-users-prod] WARN ${u.email}: rol actual "${current.rol}" → nuevo "${u.rol}"`);
        warnings++;
      }
      if (current.orgId !== orgId && orgId !== -1) {
        console.warn(`[create-users-prod] WARN ${u.email}: orgId actual ${current.orgId} → nuevo ${orgId}`);
        warnings++;
      }

      if (DRY_RUN) {
        console.log(`[create-users-prod] (dry) actualizaría ${u.email} (id=${current.id})`);
      } else {
        await db
          .update(users)
          .set({ passwordHash: hash, rol: u.rol, orgId, nombre: u.nombre })
          .where(eq(users.id, current.id));
        console.log(`[create-users-prod] actualizado ${u.email} (id=${current.id})`);
      }
      updated++;
    } else {
      if (DRY_RUN) {
        console.log(`[create-users-prod] (dry) crearía ${u.email}`);
      } else {
        const [ins] = await db
          .insert(users)
          .values({ email: u.email, nombre: u.nombre, passwordHash: hash, rol: u.rol, orgId })
          .returning({ id: users.id });
        console.log(`[create-users-prod] creado ${u.email} (id=${ins.id})`);
      }
      created++;
    }
  }

  console.log(`[create-users-prod] done. created=${created} updated=${updated} warnings=${warnings}`);
  await pool.end();
}

main().catch((e) => {
  console.error("[create-users-prod] error:", e);
  process.exit(1);
});
