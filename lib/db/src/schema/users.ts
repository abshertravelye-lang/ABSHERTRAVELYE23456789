import { pgTable, uuid, text, boolean, timestamp, pgEnum, date, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "agent", "admin", "super_admin"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  nationality: text("nationality"),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  role: userRoleEnum("role").notNull().default("customer"),
  // B2B Agent Portal: when role === "agent" this links the agent user to its
  // travel agency (agencies.id). Null for staff/customers. FK added via manual DDL.
  agencyId: integer("agency_id"),
  // Preferred notification / UI language ('ar' | 'en'). Drives push copy.
  preferredLanguage: text("preferred_language").notNull().default("ar"),
  // Staff permission keys (admin sections). Empty for customers; super_admin bypasses.
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  emailVerifyToken: text("email_verify_token"),
  phoneOtp: text("phone_otp"),
  phoneOtpExpiresAt: timestamp("phone_otp_expires_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  // ── Extended profile fields ────────────────────────────────────────────
  whatsapp: text("whatsapp"),
  address: text("address"),
  profilePhotoUrl: text("profile_photo_url"),

  // Passport details
  passportNumber: text("passport_number"),
  passportIssueCountry: text("passport_issue_country"),
  passportIssuePlace: text("passport_issue_place"),
  passportIssueDate: date("passport_issue_date"),
  passportExpiryDate: date("passport_expiry_date"),
  passportImageUrl: text("passport_image_url"),

  // GCC residence (optional — filled only if resident in GCC)
  isGccResident: boolean("is_gcc_resident").notNull().default(false),
  gccResidenceCountry: text("gcc_residence_country"),
  gccResidenceNumber: text("gcc_residence_number"),
  gccResidenceExpiry: date("gcc_residence_expiry"),
  gccResidenceFrontUrl: text("gcc_residence_front_url"),
  gccResidenceBackUrl: text("gcc_residence_back_url"),

  // European / Schengen residency (optional)
  isEuropeanResident: boolean("is_european_resident").notNull().default(false),
  europeanDocumentType: text("european_document_type"), // 'residence' | 'schengen_visa'
  europeanDocumentUrl: text("european_document_url"),
  europeanDocumentExpiry: date("european_document_expiry"),

  // Profile completion flag (computed & cached on save)
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
});

export const userSessionsTable = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  refreshTokenHash: text("refresh_token_hash").unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true, passwordHash: true, createdAt: true, updatedAt: true, deletedAt: true,
  lastLoginAt: true, emailVerifiedAt: true, phoneVerifiedAt: true,
  emailVerifyToken: true, phoneOtp: true, phoneOtpExpiresAt: true,
}).extend({
  password: z.string().min(8),
});

export const selectUserSchema = createSelectSchema(usersTable).omit({
  passwordHash: true, deletedAt: true, emailVerifyToken: true,
  phoneOtp: true, phoneOtpExpiresAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type SafeUser = Omit<User, "passwordHash" | "deletedAt" | "emailVerifyToken" | "phoneOtp" | "phoneOtpExpiresAt">;
