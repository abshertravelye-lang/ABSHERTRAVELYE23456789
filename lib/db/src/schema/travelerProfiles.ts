import {
  pgTable, uuid, text, timestamp, boolean, pgEnum, date, integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "regular_passport",
  "diplomatic_passport",
  "special_passport",
  "travel_document",
]);

export const companionTypeEnum = pgEnum("companion_type", [
  "spouse", "child", "parent", "sibling", "friend", "other",
]);

export const passportsTable = pgTable("passports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull().default("regular_passport"),
  fullNameAr: text("full_name_ar"),
  fullNameEn: text("full_name_en").notNull(),
  passportNumber: text("passport_number").notNull(),
  nationality: text("nationality").notNull(),
  nationalityCode: text("nationality_code"),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date").notNull(),
  issuingCountry: text("issuing_country"),
  issuingAuthority: text("issuing_authority"),
  mrzLine1: text("mrz_line1"),
  mrzLine2: text("mrz_line2"),
  photoUrl: text("photo_url"),
  passportPageUrl: text("passport_page_url"),
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const companionsTable = pgTable("companions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  companionType: companionTypeEnum("companion_type").notNull().default("other"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  firstNameAr: text("first_name_ar"),
  lastNameAr: text("last_name_ar"),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  nationality: text("nationality"),
  passportNumber: text("passport_number"),
  passportExpiry: date("passport_expiry"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const visaApplicationsTable = pgTable("visa_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  visaId: integer("visa_id").notNull(),
  passportId: uuid("passport_id").references(() => passportsTable.id),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPassportSchema = createInsertSchema(passportsTable).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true,
});
export const updatePassportSchema = insertPassportSchema.partial().omit({ userId: true });
export const selectPassportSchema = createSelectSchema(passportsTable);

export const insertCompanionSchema = createInsertSchema(companionsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const updateCompanionSchema = insertCompanionSchema.partial().omit({ userId: true });

export type InsertPassport = z.infer<typeof insertPassportSchema>;
export type Passport = typeof passportsTable.$inferSelect;
export type InsertCompanion = z.infer<typeof insertCompanionSchema>;
export type Companion = typeof companionsTable.$inferSelect;
