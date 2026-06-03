-- =============================================
-- APPLYFY – Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Users / profiles table
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  university TEXT,
  year       TEXT,
  study_area TEXT,
  job_type   TEXT DEFAULT 'Internship',
  reminder_pref TEXT DEFAULT 'Before deadlines',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id          BIGSERIAL PRIMARY KEY,
  user_email  TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  type        TEXT DEFAULT 'Internship',
  deadline    DATE,
  source      TEXT,
  link        TEXT,
  status      TEXT DEFAULT 'Applied',
  reminder    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_applications_user_email ON applications(user_email);

-- Enable Row Level Security (RLS) - optional but recommended
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
