import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Unified app image catalog. Every admin-manageable image surface in the
 * mobile app and public web (home banners, service cards, promotional strips,
 * etc.) is a row here, keyed by category. The public GET /app-images endpoint
 * returns only active images inside their optional scheduling window, ordered
 * by sortOrder — clients fall back to bundled/local images when a category is
 * empty.
 *
 * Categories (free-form text, but the admin UI + clients agree on):
 *   home_banner   — main home-screen banner carousel (mobile + web hero)
 *   service_card  — home service cards (mobile grid / web services section)
 *   promo         — promotional/advertising strips
 * Entity-owned images (offers/programs/destinations/visa countries) keep
 * living on their own tables; this catalog covers the previously-hardcoded
 * surfaces. relatedEntityType/Id allow optional linking to existing entities.
 */
export const appImagesTable = pgTable("app_images", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  titleAr: text("title_ar"),
  titleEn: text("title_en"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppImageSchema = createInsertSchema(appImagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppImage = z.infer<typeof insertAppImageSchema>;
export type UpdateAppImage = Partial<InsertAppImage>;
export type AppImage = typeof appImagesTable.$inferSelect;
