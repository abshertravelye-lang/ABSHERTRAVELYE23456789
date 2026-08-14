import {
  pgTable, serial, text, integer, numeric, timestamp, boolean, pgEnum, uuid, jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

// ── Visa Countries ─────────────────────────────────────────────────────────

export const visaCountryRegionEnum = pgEnum("visa_country_region", [
  "gulf", "arab", "asian", "european", "african", "american",
]);

export const visaCountriesTable = pgTable("visa_countries", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  countryCode: text("country_code").notNull(),
  region: visaCountryRegionEnum("region").notNull(),
  imageUrl: text("image_url"),
  flagEmoji: text("flag_emoji"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVisaCountrySchema = createInsertSchema(visaCountriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisaCountry = typeof visaCountriesTable.$inferInsert;
export type VisaCountry = typeof visaCountriesTable.$inferSelect;

// ── Visas ─────────────────────────────────────────────────────────────────

export const visaStatusEnum = pgEnum("visa_status", ["available", "suspended", "closed"]);
export const visaEntryTypeEnum = pgEnum("visa_entry_type", ["single", "multiple", "transit"]);
export const visaCategoryEnum = pgEnum("visa_category", [
  "tourist", "business", "medical", "visit", "study", "umrah",
]);

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").references(() => visaCountriesTable.id),
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
  acceptsGccResidency: boolean("accepts_gcc_residency").notNull().default(true),
  acceptsSchengenResidency: boolean("accepts_schengen_residency").notNull().default(false),
  acceptsUkResidency: boolean("accepts_uk_residency").notNull().default(false),
  acceptsUsVisa: boolean("accepts_us_visa").notNull().default(false),
  acceptsCanadaResidency: boolean("accepts_canada_residency").notNull().default(false),
  acceptsAustraliaResidency: boolean("accepts_australia_residency").notNull().default(false),
  requiredResidencies: text("required_residencies").array().notNull().default([]),
  requiredPriorVisas: text("required_prior_visas").array().notNull().default([]),
  allowedProfessions: text("allowed_professions").array().notNull().default([]),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  allowedMaritalStatus: text("allowed_marital_status").array().notNull().default([]),
  eligibleMessageAr: text("eligible_message_ar"),
  eligibleMessageEn: text("eligible_message_en"),
  requiresPassportImage: boolean("requires_passport_image").notNull().default(true),
  requiresPersonalPhoto: boolean("requires_personal_photo").notNull().default(true),
  requiresResidencyImage: boolean("requires_residency_image").notNull().default(false),
  requiresVisaImage: boolean("requires_visa_image").notNull().default(false),
  requiresEuropeanDoc: boolean("requires_european_doc").notNull().default(false),
  requiresSchengenDoc: boolean("requires_schengen_doc").notNull().default(false),
  // Structured eligibility (replaces loose booleans + requiredResidencies)
  gccResidencyRequirement: text("gcc_residency_requirement").notNull().default("not_required"),
  acceptedGccCountries: text("accepted_gcc_countries").array().notNull().default([]),
  europeanSchengenLogic: text("european_schengen_logic").notNull().default("neither"),
  ineligibleMessageAr: text("ineligible_message_ar"),
  ineligibleMessageEn: text("ineligible_message_en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertVisa = typeof visasTable.$inferInsert;
export type UpdateVisa = Partial<InsertVisa>;
export type Visa = typeof visasTable.$inferSelect;

// ── Visa Custom Fields ─────────────────────────────────────────────────────

export const visaCustomFieldTypeEnum = pgEnum("visa_custom_field_type", [
  "text", "textarea", "number", "select", "boolean", "date",
]);

export const visaCustomFieldsTable = pgTable("visa_custom_fields", {
  id: serial("id").primaryKey(),
  visaId: integer("visa_id").notNull().references(() => visasTable.id),
  labelAr: text("label_ar").notNull(),
  labelEn: text("label_en").notNull(),
  fieldType: visaCustomFieldTypeEnum("field_type").notNull().default("text"),
  isRequired: boolean("is_required").notNull().default(false),
  options: text("options").array().notNull().default([]),
  placeholderAr: text("placeholder_ar"),
  placeholderEn: text("placeholder_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVisaCustomFieldSchema = createInsertSchema(visaCustomFieldsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisaCustomField = typeof visaCustomFieldsTable.$inferInsert;
export type UpdateVisaCustomField = Partial<InsertVisaCustomField>;
export type VisaCustomField = typeof visaCustomFieldsTable.$inferSelect;

// ── Visa Application Submissions ──────────────────────────────────────────

export const visaApplicationSubmissionEligibilityPathEnum = pgEnum("visa_application_submission_eligibility_path", ["gcc", "alternative", "direct"]);
export const visaApplicationSubmissionGenderEnum = pgEnum("visa_application_submission_gender", ["male", "female"]);
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
  "cancelled",
]);

export const visaApplicationSubmissionsTable = pgTable("visa_application_submissions", {
  id: serial("id").primaryKey(),
  trackingNumber: text("tracking_number").unique(),
  visaId: integer("visa_id").notNull().references(() => visasTable.id),
  userId: uuid("user_id").references(() => usersTable.id),
  eligibilityPath: visaApplicationSubmissionEligibilityPathEnum("eligibility_path").notNull().default("direct"),
  gccCountry: text("gcc_country"),
  alternativeRegion: text("alternative_region"),
  fullName: text("full_name").notNull(),
  fullNameEn: text("full_name_en"),
  nationality: text("nationality").notNull(),
  gender: visaApplicationSubmissionGenderEnum("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  countryOfResidence: text("country_of_residence"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  passportNumber: text("passport_number").notNull(),
  passportIssueDate: text("passport_issue_date").notNull(),
  passportExpiryDate: text("passport_expiry_date").notNull(),
  passportIssuingCountry: text("passport_issuing_country"),
  passportImageUrl: text("passport_image_url"),
  personalPhotoUrl: text("personal_photo_url"),
  residencyImageUrl: text("residency_image_url"),
  residencyBackImageUrl: text("residency_back_image_url"),
  alternativeVisaNumber: text("alternative_visa_number"),
  alternativeVisaExpiry: text("alternative_visa_expiry"),
  visaImageUrl: text("visa_image_url"),
  customFieldResponses: jsonb("custom_field_responses").notNull().default({}),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  status: visaApplicationSubmissionStatusEnum("status").notNull().default("received"),
  adminNotes: text("admin_notes"),
  issuedVisaUrl: text("issued_visa_url"),
  // ── B2B Agent Portal (additive; reuses this table for agent applications) ──
  // When an application is submitted by a travel agent, agencyId + the agent's
  // user id are recorded, plus the agency-specific price captured server-side.
  // Agent applications use an AG-YYYY-NNNNNN tracking prefix. Null for normal
  // customer applications.
  agencyId: integer("agency_id"),
  submittedByAgentId: uuid("submitted_by_agent_id"),
  agentPrice: numeric("agent_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVisaApplicationSubmissionSchema = createInsertSchema(visaApplicationSubmissionsTable).omit({
  id: true, createdAt: true, updatedAt: true, status: true, adminNotes: true, userId: true, trackingNumber: true,
});
export type InsertVisaApplicationSubmission = typeof visaApplicationSubmissionsTable.$inferInsert;
export type UpdateVisaApplicationSubmission = {
  status?: "received" | "under_review" | "awaiting_documents" | "documents_uploaded" | "sent_to_embassy" | "processing" | "issued" | "completed" | "rejected" | "cancelled";
  adminNotes?: string;
  issuedVisaUrl?: string;
};
export type VisaApplicationSubmission = typeof visaApplicationSubmissionsTable.$inferSelect;
