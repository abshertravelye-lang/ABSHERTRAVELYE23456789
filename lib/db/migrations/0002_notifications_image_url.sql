-- Add optional public image path carried with a notification (admin broadcasts
-- with images). Nullable; existing rows are unaffected.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image_url text;
