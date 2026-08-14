-- Migration: notification_preferences table
-- Idempotent: safe to run multiple times.
-- Stores per-user push notification category preferences.

CREATE TABLE IF NOT EXISTS notification_preferences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notify_booking BOOLEAN    NOT NULL DEFAULT true,
  notify_visa   BOOLEAN     NOT NULL DEFAULT true,
  notify_promo  BOOLEAN     NOT NULL DEFAULT true,
  notify_system BOOLEAN     NOT NULL DEFAULT true,
  push_enabled  BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
