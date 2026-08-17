import { pgTable, uuid, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

/**
 * User e-wallet. One wallet per user, created lazily on first access.
 * Balances/transactions are REAL server data (no client-side mock), but no
 * real payment gateway exists yet — top-ups/withdrawals stay simulated until
 * a gateway integration lands (separate task).
 *
 * The wallet feature itself can be globally enabled/disabled from the admin
 * dashboard via the `wallet_enabled` app-setting key.
 */
export const walletsTable = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("SAR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletTxTypeEnum = pgEnum("wallet_tx_type", ["credit", "debit"]);
export const walletTxStatusEnum = pgEnum("wallet_tx_status", ["completed", "pending", "failed"]);

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => walletsTable.id, { onDelete: "cascade" }),
  type: walletTxTypeEnum("type").notNull(),
  /** Always positive; `type` decides the sign. */
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  status: walletTxStatusEnum("status").notNull().default("completed"),
  /** Free-form reference (e.g. payment reference, related entity). */
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({
  id: true, createdAt: true,
});
export type Wallet = typeof walletsTable.$inferSelect;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
