import {
  pgTable, uuid, text, boolean, numeric, timestamp, pgEnum, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

// ── Umrah Applications ──────────────────────────────────────────────────────
// A fully independent Umrah-visa application service. It shares the same
// database, users, storage, payments and notifications as the rest of the
// platform, but is NOT part of the regular visa-application submission model.

export const umrahApplicationGenderEnum = pgEnum("umrah_application_gender", ["male", "female"]);

export const umrahApplicationPaymentStatusEnum = pgEnum("umrah_application_payment_status", [
  "unpaid",
  "paid",
  "failed",
]);

// Mirrors the visa-application status vocabulary, plus an "awaiting_payment"
// value used before the pilgrim has paid the (upfront) Umrah fee.
export const umrahApplicationStatusEnum = pgEnum("umrah_application_status", [
  "awaiting_payment",
  "submitted",
  "under_review",
  "processing",
  "approved",
  "rejected",
  "completed",
]);

export const umrahApplicationsTable = pgTable("umrah_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  trackingNumber: text("tracking_number").notNull().unique(),

  // ── Sponsor (host in Saudi Arabia) ──────────────────────────────────────
  sponsorAvailable: boolean("sponsor_available").notNull(),
  sponsorResidencyImageUrl: text("sponsor_residency_image_url"),
  sponsorPhone: text("sponsor_phone"),

  // ── Applicant documents ─────────────────────────────────────────────────
  passportImageUrl: text("passport_image_url").notNull(),
  personalPhotoUrl: text("personal_photo_url").notNull(),

  // ── Applicant data (from passport OCR/MRZ) ──────────────────────────────
  fullName: text("full_name"),
  passportNumber: text("passport_number"),
  nationality: text("nationality"),
  dateOfBirth: text("date_of_birth"),
  gender: umrahApplicationGenderEnum("gender"),
  passportIssueDate: text("passport_issue_date"),
  passportExpiryDate: text("passport_expiry_date"),

  // ── Contact ──────────────────────────────────────────────────────────────
  phone: text("phone").notNull(),
  contactEmail: text("contact_email"),
  emergencyPhone: text("emergency_phone").notNull(),

  // ── Payment ────────────────────────────────────────────────────────────
  feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }),
  feeCurrency: text("fee_currency").notNull().default("SAR"),
  paymentStatus: umrahApplicationPaymentStatusEnum("payment_status").notNull().default("unpaid"),
  paymentReference: text("payment_reference"),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  // ── Application lifecycle ────────────────────────────────────────────────
  status: umrahApplicationStatusEnum("status").notNull().default("awaiting_payment"),
  adminNotes: text("admin_notes"),
  issuedVisaUrl: text("issued_visa_url"),

  // ── Declaration ──────────────────────────────────────────────────────────
  declarationAccepted: boolean("declaration_accepted").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Enforce at most ONE active Umrah application per user at the DB level.
  // "Active" = any status other than a terminal one (rejected/completed). This
  // closes the race window that the read-then-insert check in the route cannot.
  // Applied manually via psql (CREATE UNIQUE INDEX ... WHERE ...); mirrored here.
  oneActivePerUser: uniqueIndex("umrah_applications_one_active_per_user")
    .on(table.userId)
    .where(sql`status NOT IN ('rejected','completed')`),
}));

export const insertUmrahApplicationSchema = createInsertSchema(umrahApplicationsTable).omit({
  id: true, createdAt: true, updatedAt: true, trackingNumber: true, userId: true,
  status: true, paymentStatus: true, paymentReference: true, paidAt: true,
  feeAmount: true, feeCurrency: true, adminNotes: true, issuedVisaUrl: true,
});
export type InsertUmrahApplication = typeof umrahApplicationsTable.$inferInsert;
export type UmrahApplication = typeof umrahApplicationsTable.$inferSelect;
export type UpdateUmrahApplication = {
  status?: "awaiting_payment" | "submitted" | "under_review" | "processing" | "approved" | "rejected" | "completed";
  adminNotes?: string;
  issuedVisaUrl?: string;
};
