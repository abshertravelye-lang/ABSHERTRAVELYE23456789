import { pgTable, serial, text, boolean, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Promotional offers powering the mobile home-screen carousel and the web
 * "Offers" pages. Admin-managed via the dashboard; the public GET /offers
 * endpoint returns only currently-active offers (is_active AND within the
 * optional start/end window).
 *
 * NOTE: the legacy pricing columns (price/currency/duration/destination/
 * featured) are retained so existing web frontends keep working. The new
 * promotional columns (discountLabel/linkUrl/startDate/endDate/isActive/
 * sortOrder) drive the redesigned mobile home carousel.
 */
export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  imageUrl: text("image_url").notNull(),
  // Promotional carousel fields
  discountLabel: text("discount_label"),
  linkUrl: text("link_url"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // Legacy pricing fields (kept for existing web offer pages / admin)
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  duration: text("duration"),
  destination: text("destination"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type UpdateOffer = Partial<InsertOffer>;
export type Offer = typeof offersTable.$inferSelect;
