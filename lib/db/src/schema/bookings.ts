import { pgTable, serial, text, integer, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  type: text("type").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email"),
  destination: text("destination"),
  travelDate: text("travel_date"),
  returnDate: text("return_date"),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  ticketUrl: text("ticket_url"),
  duffelOrderId: text("duffel_order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
