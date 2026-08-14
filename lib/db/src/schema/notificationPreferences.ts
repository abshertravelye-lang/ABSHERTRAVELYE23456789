import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

/**
 * Per-user notification preferences.
 *
 * One row per user (upserted on first save). All channels default to enabled.
 * The four category flags map directly to relatedEntityType families:
 *   booking  → booking | flight | flight_booking
 *   visa     → visa_application | umrah_application | application
 *   promo    → offer | program | promo
 *   system   → null (admin broadcasts) | system | account
 *
 * pushEnabled is a master switch: when false, no push is sent regardless of
 * category flags. In-app rows are always written so the inbox stays complete.
 */
export const notificationPreferencesTable = pgTable("notification_preferences", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  notifyBooking:   boolean("notify_booking").notNull().default(true),
  notifyVisa:      boolean("notify_visa").notNull().default(true),
  notifyPromo:     boolean("notify_promo").notNull().default(true),
  notifySystem:    boolean("notify_system").notNull().default(true),
  pushEnabled:     boolean("push_enabled").notNull().default(true),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferencesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferencesTable);
export const updateNotificationPreferencesSchema = insertNotificationPreferencesSchema.partial().omit({ userId: true });

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
