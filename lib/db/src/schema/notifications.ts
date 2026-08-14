import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

// "in_app" is always recorded. "email" / "whatsapp" / "sms" record an attempt
// to also deliver the notification over that channel (WhatsApp/SMS providers
// are not wired up yet — those rows are created but delivery is a no-op until
// the provider integration is added).
export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app", "email", "whatsapp", "sms",
]);

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  messageAr: text("message_ar").notNull(),
  messageEn: text("message_en").notNull(),
  channel: notificationChannelEnum("channel").notNull().default("in_app"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  // Optional deep-link / external URL carried with the notification (e.g. admin
  // broadcasts). Persisted so clients can render a tap-through target.
  url: text("url"),
  isRead: boolean("is_read").notNull().default(false),
  // Set to the admin user id when this notification was created via an admin
  // broadcast (/notifications/send). Null for system/automatic notifications.
  sentBy: uuid("sent_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true, createdAt: true, isRead: true,
});
export const selectNotificationSchema = createSelectSchema(notificationsTable);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
