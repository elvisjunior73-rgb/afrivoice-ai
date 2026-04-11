
-- Table des interactions vocales (chaque enregistrement audio d'un utilisateur)
CREATE TABLE public.voice_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  language TEXT NOT NULL DEFAULT 'lin' CHECK (language IN ('lin', 'kon', 'sag')),
  audio_duration_seconds NUMERIC(10,2) DEFAULT 0,
  asr_text TEXT,
  corrected_text TEXT,
  confidence_score NUMERIC(4,3),
  is_corrected BOOLEAN NOT NULL DEFAULT false,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des conversations (échanges complets user <-> IA)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  language TEXT NOT NULL DEFAULT 'lin' CHECK (language IN ('lin', 'kon', 'sag')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_duration_seconds NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table gold dataset (corrections validées = données d'entraînement prioritaires)
CREATE TABLE public.gold_dataset (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID REFERENCES public.voice_interactions(id) ON DELETE CASCADE NOT NULL,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('lin', 'kon', 'sag')),
  audio_duration_seconds NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stats agrégées pour le dashboard
CREATE TABLE public.collection_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('lin', 'kon', 'sag')),
  source TEXT NOT NULL,
  total_seconds NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_segments INTEGER NOT NULL DEFAULT 0,
  total_corrections INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(language, source, date)
);

-- Activer RLS
ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : accès public en lecture/écriture pour le MVP (pas d'auth requise)
-- Voice interactions
CREATE POLICY "Anyone can read voice_interactions" ON public.voice_interactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert voice_interactions" ON public.voice_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update voice_interactions" ON public.voice_interactions FOR UPDATE USING (true);

-- Conversations
CREATE POLICY "Anyone can read conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- Gold dataset
CREATE POLICY "Anyone can read gold_dataset" ON public.gold_dataset FOR SELECT USING (true);
CREATE POLICY "Anyone can insert gold_dataset" ON public.gold_dataset FOR INSERT WITH CHECK (true);

-- Collection stats
CREATE POLICY "Anyone can read collection_stats" ON public.collection_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collection_stats" ON public.collection_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update collection_stats" ON public.collection_stats FOR UPDATE USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_voice_interactions_updated_at
  BEFORE UPDATE ON public.voice_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket pour les audios
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', true);

CREATE POLICY "Anyone can upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voice-recordings');
CREATE POLICY "Anyone can read recordings" ON storage.objects FOR SELECT USING (bucket_id = 'voice-recordings');
