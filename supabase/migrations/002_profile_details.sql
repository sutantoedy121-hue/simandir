-- Detail profil: username, hobi, favorit, bio.
-- Jalankan di Supabase Dashboard > SQL Editor > New Query > Run.
-- Aman dijalankan ulang (IF NOT EXISTS).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS hobi TEXT,
  ADD COLUMN IF NOT EXISTS favorit TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;
