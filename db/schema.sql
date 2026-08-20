-- SPEDICS Institute — Neon / PostgreSQL schema
-- Run once: psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Single-row site settings (contact, hero, fees flags, WhatsApp copy, etc.)
CREATE TABLE IF NOT EXISTS site_config (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme         JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flexible JSON blobs for sections that edit as a whole
CREATE TABLE IF NOT EXISTS content_docs (
  key           TEXT PRIMARY KEY,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  short_title   TEXT,
  badge         TEXT,
  description   TEXT,
  image         TEXT,
  duration      TEXT,
  eligibility   TEXT,
  mode          JSONB NOT NULL DEFAULT '[]'::jsonb,
  fee           TEXT,
  packages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules       JSONB NOT NULL DEFAULT '[]'::jsonb,
  schedule      TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_featured   BOOLEAN NOT NULL DEFAULT TRUE,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  course_ids    JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS faq_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  answer_with_fees TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  file_name     TEXT,
  image_url     TEXT,
  category      TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_meta (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title         TEXT NOT NULL DEFAULT 'Our Gallery',
  subtitle      TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  affiliation_no TEXT,
  period        TEXT,
  govt_reg_no   TEXT,
  logo          TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  note          TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  location      TEXT,
  course        TEXT,
  quote         TEXT NOT NULL,
  avatar        TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guides (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  meta_description TEXT,
  intro         TEXT,
  sections      JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_guides  JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs          JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guides_meta (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title         TEXT,
  subtitle      TEXT,
  item_ids      JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_sort ON courses (sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_sort ON gallery_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_sort ON faq_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_guides_sort ON guides (sort_order);

COMMENT ON TABLE site_config IS 'site.json fields + theme CSS variables';
COMMENT ON TABLE content_docs IS 'about, admissions, fees, learning-modes, careers, certificates-index, affiliations-meta';
