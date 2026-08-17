-- Migration: payment_methods, wallets, wallet_transactions
-- Idempotent: safe to run multiple times.
-- Dynamic admin-managed payment methods + per-user e-wallet with transactions.

-- Enums (CREATE TYPE has no IF NOT EXISTS; guard via catalog check).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_tx_type') THEN
    CREATE TYPE wallet_tx_type AS ENUM ('credit', 'debit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_tx_status') THEN
    CREATE TYPE wallet_tx_status AS ENUM ('completed', 'pending', 'failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS payment_methods (
  id             SERIAL        PRIMARY KEY,
  name_ar        TEXT          NOT NULL,
  name_en        TEXT          NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  logo_url       TEXT,
  fee_percent    NUMERIC(5,2)  NOT NULL DEFAULT 0,
  fee_fixed      NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  sort_order     INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance    NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency   TEXT          NOT NULL DEFAULT 'SAR',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id  UUID             NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type       wallet_tx_type   NOT NULL,
  amount     NUMERIC(12,2)    NOT NULL,
  title_ar   TEXT             NOT NULL,
  title_en   TEXT             NOT NULL,
  status     wallet_tx_status NOT NULL DEFAULT 'completed',
  reference  TEXT,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);
