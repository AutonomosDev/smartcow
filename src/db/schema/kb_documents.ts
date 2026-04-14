import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const kbDocuments = pgTable("kb_documents", {
  id: serial("id").primaryKey(),
  predioId: integer("predio_id").notNull(),
  nombre: text("nombre").notNull(),
  mimeType: text("mime_type").notNull(),
  fileUri: text("file_uri").notNull(),
  googleFileName: text("google_file_name").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export type KbDocument = typeof kbDocuments.$inferSelect;
export type NewKbDocument = typeof kbDocuments.$inferInsert;
