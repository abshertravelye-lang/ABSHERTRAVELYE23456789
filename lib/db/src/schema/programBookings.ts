import {
  pgTable, uuid, text, integer, numeric, timestamp, pgEnum, json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { programsTable } from "./programs";

// ── Program Booking Requests ────────────────────────────────────────────────
// Official in-platform booking requests for tourism programs (replaces the
// old "book via WhatsApp" flow). Completely separate from the e-visa system:
// its own table, its own TRV-YYYY-NNNNNN reference numbers, its own statuses.

export const programBookingStatusEnum = pgEnum("program_booking_status", [
  "draft",                 // مسودة — العميل بدأ الطلب ولم يرسله
  "submitted",             // تم استلام الطلب
  "under_review",          // قيد المراجعة
  "awaiting_availability", // بانتظار التوفر
  "awaiting_payment",      // بانتظار الدفع
  "paid",                  // تم الدفع
  "confirmed",             // تم تأكيد الحجز
  "completed",             // مكتمل
  "rejected",              // مرفوض
  "cancelled",             // ملغى
]);

/** One entry per status transition (drives the customer-facing timeline). */
export interface ProgramBookingHistoryEntry {
  status: string;
  at: string;            // ISO timestamp
  note?: string | null;  // optional staff note / message recorded with the change
  by?: "customer" | "staff" | "system";
}

export const programBookingRequestsTable = pgTable("program_booking_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestNumber: text("request_number").notNull().unique(), // TRV-YYYY-NNNNNN
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  programId: integer("program_id").notNull().references(() => programsTable.id),

  // ── Program snapshot at request time (survives later program edits) ──────
  programTitleAr: text("program_title_ar").notNull(),
  programTitleEn: text("program_title_en").notNull(),
  programDestination: text("program_destination"),
  programPrice: numeric("program_price", { precision: 10, scale: 2 }).notNull(),
  programCurrency: text("program_currency").notNull().default("SAR"),

  // ── Customer data (reviewed/confirmed in the form) ────────────────────────
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  /** Canonical English country name (master list @workspace/countries). */
  nationality: text("nationality").notNull(),
  /** ISO alpha-2 code matching `nationality`. */
  nationalityCode: text("nationality_code").notNull(),

  // ── Trip details ──────────────────────────────────────────────────────────
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  infants: integer("infants").notNull().default(0),
  travelDate: text("travel_date").notNull(),   // YYYY-MM-DD
  returnDate: text("return_date"),             // YYYY-MM-DD (optional)
  rooms: integer("rooms").notNull().default(1),
  roomType: text("room_type"),
  specialRequirements: text("special_requirements"),
  customerNotes: text("customer_notes"),

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  status: programBookingStatusEnum("status").notNull().default("submitted"),
  statusHistory: json("status_history").$type<ProgramBookingHistoryEntry[]>().notNull().default([]),
  adminNotes: text("admin_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProgramBookingSchema = createInsertSchema(programBookingRequestsTable, {
  adults: z.number().int().min(1).max(50),
  children: z.number().int().min(0).max(50),
  infants: z.number().int().min(0).max(20),
  rooms: z.number().int().min(1).max(50),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type ProgramBookingRequest = typeof programBookingRequestsTable.$inferSelect;
export type InsertProgramBooking = z.infer<typeof insertProgramBookingSchema>;
