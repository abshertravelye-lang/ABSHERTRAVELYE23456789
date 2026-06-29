import { pgTable, bigserial, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { providersTable } from "./providers";

export const auditLogsTable = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_audit_entity").on(t.entityType, t.entityId),
  index("idx_audit_created").on(t.createdAt),
]);

export const apiRequestLogsTable = pgTable("api_request_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  providerId: uuid("provider_id").references(() => providersTable.id),
  endpoint: text("endpoint"),
  method: text("method"),
  requestBody: jsonb("request_body"),
  responseStatus: text("response_status"),
  responseTimeMs: text("response_time_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_api_logs_provider").on(t.providerId),
  index("idx_api_logs_created").on(t.createdAt),
]);

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type ApiRequestLog = typeof apiRequestLogsTable.$inferSelect;
