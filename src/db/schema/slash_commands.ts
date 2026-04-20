import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const slashCommands = pgTable("slash_commands", {
  id: serial("id").primaryKey(),
  comando: text("comando").notNull().unique(),
  label: text("label").notNull(),
  modulo: text("modulo"),
  promptTemplate: text("prompt_template").notNull(),
  orden: integer("orden").notNull().default(0),
});

export type SlashCommand = typeof slashCommands.$inferSelect;
export type NuevoSlashCommand = typeof slashCommands.$inferInsert;
