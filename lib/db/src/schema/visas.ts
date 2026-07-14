import {
  pgTable, serial, text, integer, numeric, timestamp, boolean, pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const visaStatusEnum = pgEnum("visa_status", ["available", "suspended", "closed"]);
export const visaEntryTypeEnum = pgEnum("visa_entry_type", ["single", "multiple", "transit"]);

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  countryAr: text("country_ar").notNull(),
  countryEn: text("country_en").notNull(),
  countryCode: text("country_code"),
  visaType: text("visa_type").notNull(),
  requirements: text("requirements").notNull().default(""),
  documents: text("documents"),
  notes: text("notes"),
  processingDays: integer("processing_days").notNull().default(1),
  fee: numeric("fee", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"),
  stayDuration: integer("stay_duration"),
  validityDays: integer("validity_days"),
  entryType: visaEntryTypeEnum("entry_type").notNull().default("single"),
  entryCount: integer("entry_count"),
  allowedNationalities: text("allowed_nationalities").array().notNull().default([]),
  imageUrl: text("image_url"),
  status: visaStatusEnum("status").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertVisaSchema = createInsertSchema(visasTable, {
  fee: z.union([z.string(), z.number()]).transform(String),
  allowedNationalities: z.array(z.string()).optional().default([]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });

export const updateVisaSchema = insertVisaSchema.partial();
export const selectVisaSchema = createSelectSchema(visasTable);
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type UpdateVisa = z.infer<typeof updateVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
