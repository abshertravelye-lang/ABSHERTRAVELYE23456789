import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providerTypeEnum = pgEnum("provider_type", ["flight", "hotel", "both"]);

export const providersTable = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: providerTypeEnum("type").notNull(),
  apiBaseUrl: text("api_base_url"),
  authMethod: text("auth_method"),
  rateLimitRpm: integer("rate_limit_rpm").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  supportsBooking: boolean("supports_booking").notNull().default(false),
  weight: integer("weight").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true,
});

export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
