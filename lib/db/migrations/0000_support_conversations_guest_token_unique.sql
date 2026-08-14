-- Migration: add support_conversations_guest_token_unique constraint
-- Idempotent and table-existence-aware so it is safe on both fresh and
-- already-initialised databases.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'support_conversations'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_conversations_guest_token_unique'
  ) THEN
    ALTER TABLE support_conversations
      ADD CONSTRAINT support_conversations_guest_token_unique UNIQUE (guest_token);
  END IF;
END $$;
