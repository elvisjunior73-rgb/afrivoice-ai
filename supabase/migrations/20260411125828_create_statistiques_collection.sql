-- Migration: Création de la table statistiques_collection et des tables admin
-- Projet: ihsylxxuakpqciyweied (nelvis-pc-doctor)

CREATE TABLE IF NOT EXISTS public.statistiques_collection (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  langue text NOT NULL,
  source text NOT NULL,
  total_secondes numeric DEFAULT 0,
  total_segments integer DEFAULT 0,
  corrections_totales integer DEFAULT 0,
  cree_a timestamptz DEFAULT now(),
  CONSTRAINT statistiques_collection_date_langue_source_key UNIQUE (date, langue, source)
);

ALTER TABLE public.statistiques_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS allow_anon_insert ON public.statistiques_collection
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS allow_anon_select ON public.statistiques_collection
  FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS allow_anon_update ON public.statistiques_collection
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Vue collection_stats (alias avec colonnes attendues par le frontend admin)
CREATE OR REPLACE VIEW public.collection_stats AS
SELECT
  id,
  langue AS language,
  source,
  total_secondes AS total_seconds,
  total_segments,
  corrections_totales AS total_corrections,
  date,
  cree_a AS created_at
FROM public.statistiques_collection;

GRANT SELECT ON public.collection_stats TO anon;

-- Tables admin
CREATE TABLE IF NOT EXISTS public.voice_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL DEFAULT 'lin',
  audio_duration_seconds numeric DEFAULT 0,
  asr_text text,
  corrected_text text,
  is_corrected boolean DEFAULT false,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS allow_anon_all ON public.voice_interactions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL DEFAULT 'lin',
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS allow_anon_all ON public.conversations
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.gold_dataset (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL DEFAULT 'lin',
  original_text text,
  corrected_text text NOT NULL DEFAULT '',
  audio_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gold_dataset ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS allow_anon_all ON public.gold_dataset
  FOR ALL TO anon USING (true) WITH CHECK (true);
