import {
  pgTable, uuid, text, boolean, integer, smallint, numeric,
  timestamp, jsonb, pgEnum, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { providersTable } from "./providers";
import { airlinesTable } from "./airports";

export const tripTypeEnum = pgEnum("trip_type", ["one_way", "round_trip", "multi_city"]);
export const cabinClassEnum = pgEnum("cabin_class", ["economy", "premium_economy", "business", "first"]);

export const flightSearchesTable = pgTable("flight_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id),
  sessionId: text("session_id"),
  tripType: tripTypeEnum("trip_type").notNull(),
  cabinClass: cabinClassEnum("cabin_class").notNull().default("economy"),
  adults: smallint("adults").notNull().default(1),
  children: smallint("children").notNull().default(0),
  infants: smallint("infants").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  searchHash: text("search_hash").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const flightSearchLegsTable = pgTable("flight_search_legs", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchId: uuid("search_id").notNull().references(() => flightSearchesTable.id),
  legOrder: smallint("leg_order").notNull(),
  originIata: text("origin_iata").notNull(),
  destinationIata: text("destination_iata").notNull(),
  departureDate: text("departure_date").notNull(),
});

export const flightResultsCacheTable = pgTable("flight_results_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchHash: text("search_hash").notNull(),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  resultsJson: jsonb("results_json").notNull(),
  resultCount: integer("result_count"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [
  index("idx_flight_cache_hash_provider").on(t.searchHash, t.providerId),
  index("idx_flight_cache_expires").on(t.expiresAt),
]);

export const flightOffersTable = pgTable("flight_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  cacheId: uuid("cache_id").references(() => flightResultsCacheTable.id),
  providerId: uuid("provider_id").notNull().references(() => providersTable.id),
  providerOfferId: text("provider_offer_id"),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  baseFare: numeric("base_fare", { precision: 12, scale: 2 }),
  taxes: numeric("taxes", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  stops: smallint("stops").notNull().default(0),
  totalDurationMin: integer("total_duration_min"),
  isRefundable: boolean("is_refundable"),
  baggageIncludedKg: smallint("baggage_included_kg"),
  carryOnIncluded: boolean("carry_on_included").notNull().default(false),
  deeplinkUrl: text("deeplink_url"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flightOfferSegmentsTable = pgTable("flight_offer_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id").notNull().references(() => flightOffersTable.id),
  legOrder: smallint("leg_order").notNull(),
  segmentOrder: smallint("segment_order").notNull(),
  flightNumber: text("flight_number"),
  airlineIata: text("airline_iata").references(() => airlinesTable.iataCode),
  operatingAirlineIata: text("operating_airline_iata"),
  originIata: text("origin_iata").notNull(),
  destinationIata: text("destination_iata").notNull(),
  departureAt: timestamp("departure_at", { withTimezone: true }),
  arrivalAt: timestamp("arrival_at", { withTimezone: true }),
  durationMin: integer("duration_min"),
  aircraftType: text("aircraft_type"),
  cabinClass: cabinClassEnum("cabin_class"),
});

export const insertFlightSearchSchema = createInsertSchema(flightSearchesTable).omit({
  id: true, createdAt: true, deletedAt: true,
});

export type FlightSearch = typeof flightSearchesTable.$inferSelect;
export type FlightSearchLeg = typeof flightSearchLegsTable.$inferSelect;
export type FlightResultsCache = typeof flightResultsCacheTable.$inferSelect;
export type FlightOffer = typeof flightOffersTable.$inferSelect;
export type FlightOfferSegment = typeof flightOfferSegmentsTable.$inferSelect;
export type InsertFlightSearch = z.infer<typeof insertFlightSearchSchema>;
