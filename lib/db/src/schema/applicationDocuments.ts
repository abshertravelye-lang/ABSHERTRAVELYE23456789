import {
  pgTable, serial, text, integer, timestamp, boolean, pgEnum, uuid, unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { visasTable, visaApplicationSubmissionsTable } from "./visas";

// ── Shared enums ────────────────────────────────────────────────────────────

/** Which file kinds a document accepts. */
export const documentAllowedFileTypeEnum = pgEnum("document_allowed_file_type", [
  "image", "pdf", "image_pdf",
]);

/** Per-document lifecycle status — INDEPENDENT of the application status. */
export const applicationDocumentStatusEnum = pgEnum("application_document_status", [
  "required",          // defined but nothing requested/uploaded yet
  "waiting_customer",  // requested from the customer, awaiting upload
  "uploaded",          // a version was uploaded
  "under_review",      // uploaded and pending staff review
  "approved",          // accepted by staff
  "rejected",          // rejected by staff
  "reupload_required", // rejected — customer must upload a new version
]);

/** Snapshot of a version's disposition at review time. */
export const applicationDocumentVersionStatusEnum = pgEnum("application_document_version_status", [
  "uploaded", "approved", "rejected",
]);

/** When (in the application lifecycle) a visa-config document is expected. */
export const visaRequiredDocumentRequiredAtEnum = pgEnum("visa_required_document_required_at", [
  "application_start", "before_submission", "during_processing", "optional",
]);

// ── Application Documents ────────────────────────────────────────────────────
// One row per (application, documentKey). Represents a document slot bound to a
// specific application/customer/visa. May originate from visa config (requestedBy
// null) or from an employee's ad-hoc request (requestedBy set).

export const applicationDocumentsTable = pgTable("application_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => visaApplicationSubmissionsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => usersTable.id), // customer who owns the application
  visaId: integer("visa_id").references(() => visasTable.id),
  documentKey: text("document_key").notNull(), // stable slug, unique per application
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(true),
  allowedFileType: documentAllowedFileTypeEnum("allowed_file_type").notNull().default("image_pdf"),
  maxFileSizeMb: integer("max_file_size_mb"),
  status: applicationDocumentStatusEnum("status").notNull().default("required"),
  requestedBy: uuid("requested_by").references(() => usersTable.id), // employee; null for visa-config docs
  requestDescription: text("request_description"),
  rejectionReason: text("rejection_reason"),
  currentVersionId: integer("current_version_id"), // FK added at query time (avoids circular ref)
  reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Prevents duplicate document requests on double-click / retry.
  uniqApplicationDocumentKey: unique("uniq_application_document_key").on(t.applicationId, t.documentKey),
}));

export const insertApplicationDocumentSchema = createInsertSchema(applicationDocumentsTable).omit({
  id: true, createdAt: true, updatedAt: true, currentVersionId: true, reviewedBy: true, reviewedAt: true,
});
export type InsertApplicationDocument = typeof applicationDocumentsTable.$inferInsert;
export type ApplicationDocument = typeof applicationDocumentsTable.$inferSelect;

// ── Application Document Versions ────────────────────────────────────────────
// Full version history for a document slot. Old versions are NEVER deleted so
// the review trail (who/when/why) is preserved.

export const applicationDocumentVersionsTable = pgTable("application_document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => applicationDocumentsTable.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(), // e.g. "/objects/uploads/<uuid>"
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  size: integer("size"),
  uploadedBy: uuid("uploaded_by").references(() => usersTable.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  status: applicationDocumentVersionStatusEnum("status").notNull().default("uploaded"),
  rejectionReason: text("rejection_reason"),
  versionNumber: integer("version_number").notNull().default(1),
}, (t) => ({
  // Guarantees monotonic, gap-free-per-doc version numbering under concurrency.
  uniqDocumentVersionNumber: unique("uniq_document_version_number").on(t.documentId, t.versionNumber),
  // Dedupe key: uploading the SAME object to the SAME document is a no-op
  // (survives network retries without creating a duplicate version).
  uniqDocumentStoragePath: unique("uniq_document_storage_path").on(t.documentId, t.storagePath),
}));

export const insertApplicationDocumentVersionSchema = createInsertSchema(applicationDocumentVersionsTable).omit({
  id: true, uploadedAt: true,
});
export type InsertApplicationDocumentVersion = typeof applicationDocumentVersionsTable.$inferInsert;
export type ApplicationDocumentVersion = typeof applicationDocumentVersionsTable.$inferSelect;

// ── Visa Required Documents (per-visa config, fully dynamic) ─────────────────
// Super-admin-managed definitions of the documents a given visa requires. NO
// hardcoded document names — everything comes from these rows.

export const visaRequiredDocumentsTable = pgTable("visa_required_documents", {
  id: serial("id").primaryKey(),
  visaId: integer("visa_id").notNull().references(() => visasTable.id, { onDelete: "cascade" }),
  documentKey: text("document_key").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(true),
  allowedFileType: documentAllowedFileTypeEnum("allowed_file_type").notNull().default("image_pdf"),
  maxFileSizeMb: integer("max_file_size_mb"),
  requiredAt: visaRequiredDocumentRequiredAtEnum("required_at").notNull().default("application_start"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqVisaDocumentKey: unique("uniq_visa_document_key").on(t.visaId, t.documentKey),
}));

export const insertVisaRequiredDocumentSchema = createInsertSchema(visaRequiredDocumentsTable).omit({
  id: true, createdAt: true,
});
export type InsertVisaRequiredDocument = typeof visaRequiredDocumentsTable.$inferInsert;
export type VisaRequiredDocument = typeof visaRequiredDocumentsTable.$inferSelect;
