import { pgTable, uuid, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const airportsTable = pgTable("airports", {
  id: uuid("id").primaryKey().defaultRandom(),
  iataCode: text("iata_code").notNull().unique(),
  icaoCode: text("icao_code").unique(),
  nameAr: text("name_ar"),
  nameEn: text("name_en").notNull(),
  cityAr: text("city_ar"),
  cityEn: text("city_en"),
  countryCode: text("country_code").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  timezone: text("timezone"),
  isMajor: boolean("is_major").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const airlinesTable = pgTable("airlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  iataCode: text("iata_code").notNull().unique(),
  icaoCode: text("icao_code").unique(),
  nameAr: text("name_ar"),
  nameEn: text("name_en").notNull(),
  logoUrl: text("logo_url"),
  countryCode: text("country_code"),
  alliance: text("alliance"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const insertAirportSchema = createInsertSchema(airportsTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export const insertAirlineSchema = createInsertSchema(airlinesTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type Airport = typeof airportsTable.$inferSelect;
export type Airline = typeof airlinesTable.$inferSelect;
export type InsertAirport = z.infer<typeof insertAirportSchema>;
export type InsertAirline = z.infer<typeof insertAirlineSchema>;
