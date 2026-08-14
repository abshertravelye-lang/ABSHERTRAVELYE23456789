import {
  pgTable, serial, integer, text, boolean, numeric, timestamp, pgEnum, uuid, uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { visasTable } from "./visas";

// ── Travel Agencies (B2B Agent Portal) ──────────────────────────────────────
//
// An agency is a business partner of ABSHER TRAVEL. Admin creates the agency,
// creates agent user accounts (role "agent" + users.agency_id FK), assigns which
// visa services the agency can sell and at what agent-specific price.
// Everything is enforced server-side; agents never self-provision.

export const agencyStatusEnum = pgEnum("agency_status", ["active", "suspended", "pending"]);

export const agenciesTable = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  notes: text("notes"),
  status: agencyStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAgencySchema = createInsertSchema(agenciesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAgency = typeof agenciesTable.$inferInsert;
export type UpdateAgency = Partial<InsertAgency>;
export type Agency = typeof agenciesTable.$inferSelect;

// ── Agency ↔ Visa service availability & pricing ─────────────────────────────
//
// Controls which visas an agency can see (enabled) and the AGENT price it pays
// (distinct from the customer price on visas.fee). If a row is absent OR
// disabled, the agency cannot see or apply for that visa. The agent price is the
// authoritative price recorded on the application — never trusted from the client.

export const agencyVisaServicesTable = pgTable(
  "agency_visa_services",
  {
    id: serial("id").primaryKey(),
    agencyId: integer("agency_id").notNull().references(() => agenciesTable.id, { onDelete: "cascade" }),
    visaId: integer("visa_id").notNull().references(() => visasTable.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(true),
    agentPrice: numeric("agent_price", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("SAR"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agencyVisaUnique: uniqueIndex("agency_visa_services_agency_visa_uq").on(t.agencyId, t.visaId),
  }),
);

export const insertAgencyVisaServiceSchema = createInsertSchema(agencyVisaServicesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAgencyVisaService = typeof agencyVisaServicesTable.$inferInsert;
export type UpdateAgencyVisaService = Partial<InsertAgencyVisaService>;
export type AgencyVisaService = typeof agencyVisaServicesTable.$inferSelect;
