import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, Edit3, Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  type Language,
  type LearnItem,
  type Category,
  LANG_META,
  CATEGORIES,
} from "@/data/learnData";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afrivoice-tts`;

const LearnPage = () => {
  const [lang, setLang] = useState<Language>("lin");
  const [activeCat, setActiveCat] = useState<Category>(CATEGORIES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizRevealed, setQuizRevealed] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const speak = useCallback(async (text: string, itemId: string) => {
    if (playingId === itemId) return;
    setPlayingId(itemId);
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, language: lang }),
      });
      if (resp.ok && resp.headers.get("content-type")?.includes("audio")) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url); };
        audio.onerror = () => { setPlayingId(null); fallbackSpeak(text); };
        await audio.play();
        return;
      }
    } catch {}
    fallbackSpeak(text);
  }, [lang, playingId]);

  const fallbackSpeak = (text: string) => {
    if (!("speechSynthesis" in window)) { setPlayingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "lin" ? "fr-CD" : lang === "kon" ? "fr-CG" : "fr";
    u.rate = 0.85;
    u.onend = () => setPlayingId(null);
    u.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(u);
  };

  const saveCorrection = async (item: LearnItem) => {
    const corrected = editText.trim();
    if (!corrected || corrected === item.translations[lang]) {
      setEditingId(null);
      return;
    }
    const original = item.translations[lang];

    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: crypto.randomUUID(),
      language: lang,
      asr_text: original,
      corrected_text: corrected,
      is_corrected: true,
      is_validated: true,
      confidence_score: 0.5,
    }).select().single();

    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id,
        original_text: original,
        corrected_text: corrected,
        language: lang,
      });
    }

    // Update local data
    item.translations[lang] = corrected;
    setEditingId(null);
    toast({ title: "Merci ! Correction enregistrée 🌱" });
  };

  const toggleQuizReveal = (id: string) => {
    setQuizRevealed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Apprendre en jouant
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Alphabet, nombres, animaux — corrige si c'est faux !
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["lin", "kon", "sag"] as Language[]).map((code) => (
              <button key={code} onClick={() => { setLang(code); setQuizRevealed(new Set()); }}
                className={`text-lg p-1.5 rounded-lg transition-all ${lang === code ? "bg-primary/10 scale-110" : "opacity-40 hover:opacity-70"}`}>
                {LANG_META[code].flag}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-3xl">
        {/* Language badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-lg">{LANG_META[lang].flag}</span>
            <span className="text-sm font-display font-bold text-primary">{LANG_META[lang].name}</span>
          </div>
          <Button
            variant={quizMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setQuizMode(!quizMode); setQuizRevealed(new Set()); }}
            className="gap-2 rounded-full"
          >
            🎮 {quizMode ? "Mode normal" : "Mode quiz"}
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => { setActiveCat(cat); setQuizRevealed(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
                activeCat.id === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/50 border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Category description */}
        <motion.p
          key={activeCat.id}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground mb-4"
        >
          {activeCat.emoji} {activeCat.description} — <span className="text-foreground font-medium">{activeCat.items.length} mots</span>
        </motion.p>

        {/* Items grid */}
        <motion.div
          key={`${activeCat.id}-${lang}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {activeCat.items.map((item, i) => {
            const isEditing = editingId === item.id;
            const isPlaying = playingId === item.id;
            const isRevealed = quizRevealed.has(item.id);
            const translation = item.translations[lang];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`relative rounded-2xl border p-4 transition-all ${
                  isPlaying
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card/60 hover:border-primary/30"
                }`}
              >
                {/* Emoji + French */}
                <div className="text-center mb-2">
                  <span className="text-3xl block mb-1">{item.emoji}</span>
                  <span className="text-xs text-muted-foreground font-medium">{item.french}</span>
                </div>

                {/* Translation */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="text-sm h-8"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveCorrection(item); if (e.key === "Escape") setEditingId(null); }}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs flex-1 gap-1" onClick={() => saveCorrection(item)}>
                        <Check className="w-3 h-3" /> OK
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {quizMode && !isRevealed ? (
                      <button
                        onClick={() => toggleQuizReveal(item.id)}
                        className="w-full py-2 rounded-lg bg-primary/10 border border-dashed border-primary/30 text-xs text-primary font-medium hover:bg-primary/20 transition-colors"
                      >
                        👀 Révéler
                      </button>
                    ) : (
                      <motion.p
                        initial={quizMode ? { rotateY: 90 } : false}
                        animate={{ rotateY: 0 }}
                        className="font-display font-bold text-foreground text-sm mb-2 cursor-pointer"
                        onClick={() => quizMode && toggleQuizReveal(item.id)}
                      >
                        {translation}
                      </motion.p>
                    )}

                    {(!quizMode || isRevealed) && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button
                          onClick={() => speak(translation, item.id)}
                          className={`p-1.5 rounded-full transition-all ${
                            isPlaying ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          }`}
                          title="Écouter"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingId(item.id); setEditText(translation); }}
                          className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                          title="Corriger"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer help */}
        <div className="mt-8 mb-6 text-center">
          <p className="text-xs text-muted-foreground/70">
            🧒 Conçu pour les enfants de la diaspora — apprends avec tes parents !<br />
            ✏️ Tu vois une erreur ? Clique sur le crayon pour corriger.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
