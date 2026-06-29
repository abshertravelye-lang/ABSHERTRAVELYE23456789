import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  countryAr: text("country_ar").notNull(),
  countryEn: text("country_en").notNull(),
  countryCode: text("country_code"),
  visaType: text("visa_type").notNull(),
  requirements: text("requirements").notNull(),
  documents: text("documents"),
  processingDays: integer("processing_days").notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({ id: true, createdAt: true });
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
