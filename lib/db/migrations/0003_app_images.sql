-- Unified admin-managed app image catalog (home banners, service cards,
-- promotional strips). Matches lib/db/src/schema/appImages.ts. Idempotent.
CREATE TABLE IF NOT EXISTS app_images (
  id serial PRIMARY KEY,
  category text NOT NULL,
  title_ar text,
  title_en text,
  image_url text NOT NULL,
  link_url text,
  related_entity_type text,
  related_entity_id text,
  sort_order integer NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_images_category_idx ON app_images (category, sort_order);
