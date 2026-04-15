/**
 * src/lib/queries/conversaciones.ts — Queries para historial de conversaciones del chat IA.
 * Scoped por user_id: el historial es personal, no del predio.
 * Ticket: AUT-144
 */

import { db } from "@/src/db/client";
import { conversaciones } from "@/src/db/schema/index";
import { eq, and, desc } from "drizzle-orm";
import type { Conversacion, MensajeChat } from "@/src/db/schema/conversaciones";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ConversacionResumen {
  id: number;
  titulo: string;
  actualizadoEn: Date;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Lista las conversaciones del usuario para el sidebar.
 * Retorna solo id, titulo, actualizadoEn — sin el jsonb de mensajes.
 */
export async function getConversacionesUsuario(
  userId: number,
  predioId: number,
  limit = 50
): Promise<ConversacionResumen[]> {
  const rows = await db
    .select({
      id: conversaciones.id,
      titulo: conversaciones.titulo,
      actualizadoEn: conversaciones.actualizadoEn,
    })
    .from(conversaciones)
    .where(
      and(
        eq(conversaciones.userId, userId),
        eq(conversaciones.predioId, predioId)
      )
    )
    .orderBy(desc(conversaciones.actualizadoEn))
    .limit(limit);

  return rows;
}

/**
 * Carga una conversación completa con mensajes.
 * Valida que pertenezca al userId para evitar acceso cruzado.
 */
export async function getConversacionById(
  id: number,
  userId: number
): Promise<Conversacion | null> {
  const rows = await db
    .select()
    .from(conversaciones)
    .where(and(eq(conversaciones.id, id), eq(conversaciones.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Crea una conversación nueva (sin mensajes — se persisten al finalizar el turno).
 * El título se genera desde el primer mensaje del usuario.
 */
export async function crearConversacion(data: {
  userId: number;
  predioId: number;
  titulo: string;
}): Promise<Conversacion> {
  const rows = await db
    .insert(conversaciones)
    .values({
      userId: data.userId,
      predioId: data.predioId,
      titulo: data.titulo,
      mensajes: [],
    })
    .returning();

  return rows[0];
}

/**
 * Actualiza los mensajes de una conversación tras el evento SSE "done".
 * Valida ownership por userId antes de actualizar.
 */
export async function actualizarMensajes(
  id: number,
  userId: number,
  mensajes: MensajeChat[]
): Promise<void> {
  await db
    .update(conversaciones)
    .set({
      mensajes,
      actualizadoEn: new Date(),
    })
    .where(and(eq(conversaciones.id, id), eq(conversaciones.userId, userId)));
}
