import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

/**
 * object_uploads — the authoritative record of who owns each stored object.
 *
 * Ownership of a private storage object (passport, ID, personal photo, …) is
 * bound HERE at upload time, not inferred from caller-writable rows. The access
 * authorization check for GET /api/storage/objects/* is a lookup in this table
 * only, so a user cannot gain access to another user's object by writing that
 * object's path into their own profile / application fields.
 */
export const objectUploadsTable = pgTable("object_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Canonical storage path, e.g. "/objects/uploads/<uuid>". Unique so the same
  // object can never be claimed by two owners.
  storagePath: text("storage_path").notNull().unique(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  size: integer("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObjectUploadSchema = createInsertSchema(objectUploadsTable).omit({
  id: true, createdAt: true,
});
export const selectObjectUploadSchema = createSelectSchema(objectUploadsTable);
export type InsertObjectUpload = z.infer<typeof insertObjectUploadSchema>;
export type ObjectUpload = typeof objectUploadsTable.$inferSelect;
