-- ============================================================
-- AfriVoice AI — Schema complet
-- Migration : 2026-04-11
-- ============================================================

-- Table des interactions vocales (ASR + corrections)
CREATE TABLE IF NOT EXISTS interactions_vocales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID,
  audio_url TEXT,
  asr_text TEXT,
  corrected_text TEXT,
  language VARCHAR(3) NOT NULL CHECK (language IN ('lin', 'kon', 'sag')),
  confidence FLOAT DEFAULT 0.0,
  is_corrected BOOLEAN DEFAULT FALSE,
  corrected_at TIMESTAMPTZ,
  corrected_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table du gold dataset (données corrigées validées)
CREATE TABLE IF NOT EXISTS ensemble_de_donnees_or (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID REFERENCES interactions_vocales(id),
  audio_url TEXT,
  asr_text TEXT,
  corrected_text TEXT NOT NULL,
  language VARCHAR(3) NOT NULL CHECK (language IN ('lin', 'kon', 'sag')),
  confidence FLOAT DEFAULT 0.0,
  user_id UUID,
  exported_to_hf BOOLEAN DEFAULT FALSE,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des statistiques de collecte
CREATE TABLE IF NOT EXISTS statistiques_de_collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  language VARCHAR(3) NOT NULL CHECK (language IN ('lin', 'kon', 'sag')),
  total_interactions INTEGER DEFAULT 0,
  total_corrections INTEGER DEFAULT 0,
  total_audio_hours FLOAT DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language)
);

-- Initialiser les statistiques pour les 3 langues
INSERT INTO statistiques_de_collection (language) 
VALUES ('lin'), ('kon'), ('sag')
ON CONFLICT (language) DO NOTHING;

-- Fonction pour incrémenter les statistiques
CREATE OR REPLACE FUNCTION increment_collection_stats(
  p_language VARCHAR(3),
  p_corrections INTEGER DEFAULT 0,
  p_interactions INTEGER DEFAULT 0,
  p_audio_hours FLOAT DEFAULT 0.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO statistiques_de_collection (language, total_corrections, total_interactions, total_audio_hours, last_updated)
  VALUES (p_language, p_corrections, p_interactions, p_audio_hours, NOW())
  ON CONFLICT (language) DO UPDATE
  SET 
    total_corrections = statistiques_de_collection.total_corrections + p_corrections,
    total_interactions = statistiques_de_collection.total_interactions + p_interactions,
    total_audio_hours = statistiques_de_collection.total_audio_hours + p_audio_hours,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_interactions_language ON interactions_vocales(language);
CREATE INDEX IF NOT EXISTS idx_interactions_corrected ON interactions_vocales(is_corrected);
CREATE INDEX IF NOT EXISTS idx_gold_language ON ensemble_de_donnees_or(language);
CREATE INDEX IF NOT EXISTS idx_gold_exported ON ensemble_de_donnees_or(exported_to_hf);

-- RLS (Row Level Security)
ALTER TABLE interactions_vocales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensemble_de_donnees_or ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistiques_de_collection ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire les statistiques
CREATE POLICY "Public read stats" ON statistiques_de_collection
  FOR SELECT USING (true);

-- Politique : les utilisateurs authentifiés peuvent insérer des interactions
CREATE POLICY "Authenticated insert interactions" ON interactions_vocales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Politique : lecture publique des statistiques
CREATE POLICY "Public read interactions" ON interactions_vocales
  FOR SELECT USING (true);
