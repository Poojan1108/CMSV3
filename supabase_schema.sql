-- ==============================================================================
-- ResolveX CMS - Supabase Database Schema & Security Policies
-- ==============================================================================
-- Run this complete script in your Supabase Project: SQL Editor > New Query > Run

-- 1. Profiles Table (Stores user identity, role, and organization template)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,                       -- Matches Firebase User UID
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',      -- 'student' | 'staff' | 'admin'
  org_key TEXT NOT NULL DEFAULT 'COLLEGE',   -- 'COLLEGE' | 'SOCIETY' | 'CORPORATE' | 'CUSTOM'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Complaints Table (Stores complaint tickets with full lifecycle tracking)
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY,                       -- e.g. CMS-2026-1001
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',   -- 'low' | 'medium' | 'high' | 'urgent'
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'in_progress' | 'pending_confirmation' | 'resolved' | 'rejected'
  location TEXT,
  org_key TEXT NOT NULL DEFAULT 'COLLEGE',
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_meta JSONB,
  assigned_to JSONB,
  resolution_details JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- 3. Complaint Status History Table (Audit log for every status progression)
CREATE TABLE IF NOT EXISTS public.complaint_history (
  id BIGSERIAL PRIMARY KEY,
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Complaint Comments Table (Internal notes & public discussion thread)
CREATE TABLE IF NOT EXISTS public.complaint_comments (
  id TEXT PRIMARY KEY,
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id TEXT,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'student',
  text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_org ON public.complaints(org_key);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_history_complaint ON public.complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_comments_complaint ON public.complaint_comments(complaint_id);

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon key (client-side querying)
CREATE POLICY "Allow anon read-write access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read-write access to complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read-write access to complaint_history" ON public.complaint_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read-write access to complaint_comments" ON public.complaint_comments FOR ALL USING (true) WITH CHECK (true);
