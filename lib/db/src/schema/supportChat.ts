import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

// ── In-app support chat ─────────────────────────────────────────────────────
// A conversation is either owned by a registered user (userId set) or by a
// guest (guestName + guestToken). A guest conversation can later be claimed by
// a logged-in account (userId is filled, history preserved).

export const supportConversationsTable = pgTable("support_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Null for guests; set to the owning account once linked/claimed.
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  guestName: text("guest_name"),
  // Random secret used by unauthenticated guests to access their conversation.
  guestToken: text("guest_token").unique(),
  status: text("status").notNull().default("open"), // 'open' | 'closed'
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  customerUnreadCount: integer("customer_unread_count").notNull().default(0),
  staffUnreadCount: integer("staff_unread_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // At most one OPEN conversation per registered user (partial unique index).
  // Applied manually via psql; mirrored here for schema parity.
  oneOpenPerUser: uniqueIndex("support_conversations_one_open_per_user")
    .on(t.userId)
    .where(sql`status = 'open' AND user_id IS NOT NULL`),
}));

export const supportMessagesTable = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => supportConversationsTable.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // 'customer' | 'staff'
  // Staff user id when sender = 'staff'; customer user id when known.
  senderUserId: uuid("sender_user_id"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSupportConversationSchema = createInsertSchema(
  supportConversationsTable as any,
).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSupportConversationSchema = createSelectSchema(supportConversationsTable as any);
export const insertSupportMessageSchema = createInsertSchema(supportMessagesTable as any).omit({
  id: true,
  createdAt: true,
});
export const selectSupportMessageSchema = createSelectSchema(supportMessagesTable as any);

export type InsertSupportConversation = z.infer<typeof insertSupportConversationSchema>;
export type SupportConversation = typeof supportConversationsTable.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessagesTable.$inferSelect;
