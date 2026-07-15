import {
  pgTable, serial, text, integer, numeric, timestamp, boolean, pgEnum, uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const visaStatusEnum = pgEnum("visa_status", ["available", "suspended", "closed"]);
export const visaEntryTypeEnum = pgEnum("visa_entry_type", ["single", "multiple", "transit"]);
export const visaCategoryEnum = pgEnum("visa_category", [
  "tourist", "business", "medical", "visit", "study", "umrah",
]);

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  countryAr: text("country_ar").notNull(),
  countryEn: text("country_en").notNull(),
  countryCode: text("country_code"),
  visaType: text("visa_type").notNull(),
  category: visaCategoryEnum("category").notNull().default("tourist"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
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
  blockedNationalities: text("blocked_nationalities").array().notNull().default([]),
  imageUrl: text("image_url"),
  status: visaStatusEnum("status").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
  // Dynamic eligibility rules — control which application path(s) are offered for this visa.
  acceptsGccResidency: boolean("accepts_gcc_residency").notNull().default(true),
  acceptsSchengenResidency: boolean("accepts_schengen_residency").notNull().default(false),
  acceptsUkResidency: boolean("accepts_uk_residency").notNull().default(false),
  acceptsUsVisa: boolean("accepts_us_visa").notNull().default(false),
  acceptsCanadaResidency: boolean("accepts_canada_residency").notNull().default(false),
  acceptsAustraliaResidency: boolean("accepts_australia_residency").notNull().default(false),
  // Dynamic document requirements — control which uploads are requested from the applicant.
  requiresPassportImage: boolean("requires_passport_image").notNull().default(true),
  requiresPersonalPhoto: boolean("requires_personal_photo").notNull().default(true),
  requiresResidencyImage: boolean("requires_residency_image").notNull().default(false),
  requiresVisaImage: boolean("requires_visa_image").notNull().default(false),
  ineligibleMessageAr: text("ineligible_message_ar"),
  ineligibleMessageEn: text("ineligible_message_en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertVisaSchema = createInsertSchema(visasTable, {
  fee: z.union([z.string(), z.number()]).transform(String),
  allowedNationalities: z.array(z.string()).optional().default([]),
  blockedNationalities: z.array(z.string()).optional().default([]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });

export const updateVisaSchema = insertVisaSchema.partial();
export const selectVisaSchema = createSelectSchema(visasTable);
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type UpdateVisa = z.infer<typeof updateVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;

// Note: named "submission" (not just "visa applications") because a
// different, unrelated `visaApplicationsTable` (uuid-based, tied to
// authenticated user profiles) already exists in `travelerProfiles.ts` /
// the `visa_applications` table. This is the public, unauthenticated
// application-wizard submission created from the visas page.
export const visaApplicationSubmissionEligibilityPathEnum = pgEnum("visa_application_submission_eligibility_path", ["gcc", "alternative", "direct"]);
export const visaApplicationSubmissionGenderEnum = pgEnum("visa_application_submission_gender", ["male", "female"]);
// Full application lifecycle, per the client-facing tracking workflow:
// received -> under_review -> awaiting_documents -> documents_uploaded ->
// sent_to_embassy -> processing -> issued -> completed, or rejected at any point.
export const visaApplicationSubmissionStatusEnum = pgEnum("visa_application_submission_status", [
  "received",
  "under_review",
  "awaiting_documents",
  "documents_uploaded",
  "sent_to_embassy",
  "processing",
  "issued",
  "completed",
  "rejected",
]);

export const visaApplicationSubmissionsTable = pgTable("visa_application_submissions", {
  id: serial("id").primaryKey(),
  visaId: integer("visa_id").notNull().references(() => visasTable.id),
  // Applications are now created only by authenticated customers; this links
  // each application to the account so it shows up in "My Requests".
  userId: uuid("user_id").references(() => usersTable.id),
  eligibilityPath: visaApplicationSubmissionEligibilityPathEnum("eligibility_path").notNull(),
  gccCountry: text("gcc_country"),
  alternativeRegion: text("alternative_region"),
  fullName: text("full_name").notNull(),
  nationality: text("nationality").notNull(),
  passportNumber: text("passport_number").notNull(),
  passportIssueDate: text("passport_issue_date").notNull(),
  passportExpiryDate: text("passport_expiry_date").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: visaApplicationSubmissionGenderEnum("gender").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  passportImageUrl: text("passport_image_url"),
  personalPhotoUrl: text("personal_photo_url"),
  residencyImageUrl: text("residency_image_url"),
  visaImageUrl: text("visa_image_url"),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  status: visaApplicationSubmissionStatusEnum("status").notNull().default("received"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVisaApplicationSubmissionSchema = createInsertSchema(visaApplicationSubmissionsTable).omit({
  id: true, createdAt: true, updatedAt: true, status: true, adminNotes: true, userId: true,
});
export const updateVisaApplicationSubmissionSchema = z.object({
  status: z.enum([
    "received", "under_review", "awaiting_documents", "documents_uploaded",
    "sent_to_embassy", "processing", "issued", "completed", "rejected",
  ]).optional(),
  adminNotes: z.string().optional(),
});
export const selectVisaApplicationSubmissionSchema = createSelectSchema(visaApplicationSubmissionsTable);
export type InsertVisaApplicationSubmission = z.infer<typeof insertVisaApplicationSubmissionSchema>;
export type UpdateVisaApplicationSubmission = z.infer<typeof updateVisaApplicationSubmissionSchema>;
export type VisaApplicationSubmission = typeof visaApplicationSubmissionsTable.$inferSelect;
