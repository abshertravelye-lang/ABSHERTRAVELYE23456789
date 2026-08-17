import {
  pgTable, serial, text, boolean, numeric, integer, timestamp, pgEnum, json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const programStatusEnum = pgEnum("program_status", [
  "active", "featured", "new", "special_offer", "expired", "hidden",
]);

export const programsTable = pgTable("programs", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionAr: text("description_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  country: text("country").notNull().default(""),
  cities: text("cities").array().notNull().default([]),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"),
  days: integer("days").notNull().default(1),
  nights: integer("nights"),
  imageUrl: text("image_url").notNull().default(""),
  images: text("images").array().notNull().default([]),
  dailyItinerary: json("daily_itinerary").$type<
    Array<{ day: number; titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string }>
  >().default([]),
  hotels: json("hotels").$type<
    Array<{ nameAr: string; nameEn: string; stars: number; city: string }>
  >().default([]),
  airlines: text("airlines").array().notNull().default([]),
  includedServices: text("included_services").array().notNull().default([]),
  excludedServices: text("excluded_services").array().notNull().default([]),
  included: text("included"),
  bookingTerms: text("booking_terms"),
  cancellationPolicy: text("cancellation_policy"),
  destination: text("destination"),
  // ── Booking-request detail fields (all managed from the admin panel) ──────
  /** Room type options offered to the customer in the booking form. */
  roomTypes: text("room_types").array().notNull().default([]),
  /** Meals plan description (e.g. "إفطار يومي / Half board"). */
  meals: text("meals"),
  /** Transportation description (e.g. "مواصلات من وإلى المطار"). */
  transport: text("transport"),
  /** Included excursions / tours. */
  tours: text("tours").array().notNull().default([]),
  /** Fixed program date (free text or YYYY-MM-DD) when the program runs on a set date. */
  programDate: text("program_date"),
  /** Extra admin notes shown to the customer on the program page. */
  notesAr: text("notes_ar"),
  notesEn: text("notes_en"),
  status: programStatusEnum("status").notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertProgramSchema = createInsertSchema(programsTable, {
  price: z.union([z.string(), z.number()]).transform(String),
  cities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  airlines: z.array(z.string()).optional().default([]),
  includedServices: z.array(z.string()).optional().default([]),
  excludedServices: z.array(z.string()).optional().default([]),
  roomTypes: z.array(z.string()).optional().default([]),
  tours: z.array(z.string()).optional().default([]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });

export const updateProgramSchema = insertProgramSchema.partial();
export const selectProgramSchema = createSelectSchema(programsTable);
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type UpdateProgram = z.infer<typeof updateProgramSchema>;
export type Program = typeof programsTable.$inferSelect;
