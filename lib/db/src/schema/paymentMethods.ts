import { pgTable, serial, text, boolean, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Dynamic payment methods managed entirely from the admin dashboard.
 * The mobile app and web read the ACTIVE methods (sorted by sortOrder) at
 * runtime, so admins can add/edit/reorder/hide methods without shipping a
 * new app version.
 *
 * Fees: `feePercent` (% of the amount) and/or `feeFixed` (flat amount in the
 * payment currency). Both default to 0 (no fees).
 */
export const paymentMethodsTable = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  /** PUBLIC storage path (e.g. /api/storage/public-objects/...) or absolute URL. */
  logoUrl: text("logo_url"),
  feePercent: numeric("fee_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  feeFixed: numeric("fee_fixed", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethodsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type UpdatePaymentMethod = Partial<InsertPaymentMethod>;
export type PaymentMethod = typeof paymentMethodsTable.$inferSelect;
