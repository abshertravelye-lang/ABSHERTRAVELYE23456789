import { pgTable, uuid, text, boolean, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
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
