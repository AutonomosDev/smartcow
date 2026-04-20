/**
 * GET /api/chat/slash-commands
 * Retorna los slash commands disponibles para el chat, ordenados por `orden`.
 * Público (no requiere auth) — son comandos estáticos de UI, no datos privados.
 * Ticket: AUT-257
 */

import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { slashCommands } from "@/src/db/schema/index";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: slashCommands.id,
        comando: slashCommands.comando,
        label: slashCommands.label,
        modulo: slashCommands.modulo,
        promptTemplate: slashCommands.promptTemplate,
        orden: slashCommands.orden,
      })
      .from(slashCommands)
      .orderBy(asc(slashCommands.orden));

    return NextResponse.json(rows);
  } catch {
    // Si la tabla no existe o está vacía, retornar fallback
    return NextResponse.json([
      { id: 1, comando: "/feedlot",    label: "Feedlot",    modulo: "feedlot", promptTemplate: "Focus en feedlot: últimos pesajes, GDP por lote, días en engorde.", orden: 1 },
      { id: 2, comando: "/novillos",   label: "Novillos",   modulo: null,      promptTemplate: "Focus en novillos: conteo, pesajes, GDP.", orden: 4 },
      { id: 3, comando: "/partos",     label: "Partos",     modulo: "crianza", promptTemplate: "Últimos partos del predio (2026): fecha, resultado, tasa.", orden: 5 },
      { id: 4, comando: "/pesajes",    label: "Pesajes",    modulo: null,      promptTemplate: "Últimos pesajes del predio con GDP por lote.", orden: 6 },
      { id: 5, comando: "/ventas",     label: "Ventas",     modulo: null,      promptTemplate: "Ventas 2026: total, peso promedio, destino.", orden: 8 },
    ]);
  }
}
