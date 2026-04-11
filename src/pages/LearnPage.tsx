import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, Edit3, Check, X, Sparkles, Send, Loader2, Newspaper, Radio, MessageSquare, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStreamChat } from "@/hooks/useStreamChat";
import { supabase } from "@/integrations/supabase/client";
import {
  type Language,
  type LearnItem,
  type Category,
  LANG_META,
  CATEGORIES,
} from "@/data/learnData";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afrivoice-tts`;
const NEWS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afrivoice-news`;

type Tab = "vocab" | "chat" | "news";
type ChatMsg = { role: "user" | "assistant"; content: string };
type NewsItem = { title: string; description: string; link: string; source: string };

const LearnPage = () => {
  const [lang, setLang] = useState<Language>("lin");
  const [activeTab, setActiveTab] = useState<Tab>("vocab");

  // ── Vocab state ──
  const [activeCat, setActiveCat] = useState<Category>(CATEGORIES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizRevealed, setQuizRevealed] = useState<Set<string>>(new Set());

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { streamChat } = useStreamChat();

  // ── News state ──
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [radioText, setRadioText] = useState("");
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── TTS ──
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

  // ── Speak any text (for radio/chat) ──
  const speakText = async (text: string) => {
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.slice(0, 500), language: lang }),
      });
      if (resp.ok && resp.headers.get("content-type")?.includes("audio")) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch {}
    // fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "lin" ? "fr-CD" : lang === "kon" ? "fr-CG" : "fr";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // ── Corrections ──
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

  // ── Chat ──
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg: ChatMsg = { role: "user", content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...chatMessages, userMsg],
        language: lang,
        onDelta: upsertAssistant,
        onDone: () => setChatLoading(false),
      });
    } catch (e: any) {
      setChatLoading(false);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // ── News ──
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const resp = await fetch(NEWS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ language: lang, mode: "headlines" }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setNewsItems(data.items || []);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setNewsLoading(false);
  };

  const startRadio = async () => {
    if (radioPlaying) {
      setRadioPlaying(false);
      setRadioText("");
      return;
    }
    setRadioLoading(true);
    setRadioPlaying(true);
    setRadioText("");

    try {
      const resp = await fetch(NEWS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ language: lang, mode: "radio" }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Erreur radio");
      }

      setRadioLoading(false);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setRadioText(full);
            }
          } catch {}
        }
      }

      // Auto-read with TTS
      if (full) {
        speakText(full);
      }
    } catch (e: any) {
      toast({ title: "Erreur radio", description: e.message, variant: "destructive" });
    }
    setRadioLoading(false);
  };

  // Load news when switching to news tab
  useEffect(() => {
    if (activeTab === "news" && newsItems.length === 0) {
      fetchNews();
    }
  }, [activeTab]);

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "vocab", icon: <BookOpen className="w-4 h-4" />, label: "Vocabulaire" },
    { id: "chat", icon: <MessageSquare className="w-4 h-4" />, label: "Chat" },
    { id: "news", icon: <Newspaper className="w-4 h-4" />, label: "Infos & Radio" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                Vocabulaire, conversation, infos en langues africaines
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

      {/* Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language badge */}
      <div className="container mx-auto px-4 pt-4 max-w-3xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit mb-4">
          <span className="text-lg">{LANG_META[lang].flag}</span>
          <span className="text-sm font-display font-bold text-primary">{LANG_META[lang].name}</span>
        </div>
      </div>

      {/* ═══ TAB: VOCABULAIRE ═══ */}
      {activeTab === "vocab" && (
        <div className="container mx-auto px-4 pb-8 max-w-3xl flex-1">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button
              variant={quizMode ? "default" : "outline"}
              size="sm"
              onClick={() => { setQuizMode(!quizMode); setQuizRevealed(new Set()); }}
              className="gap-2 rounded-full"
            >
              🎮 {quizMode ? "Mode normal" : "Mode quiz"}
            </Button>
          </div>

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

          <motion.p key={activeCat.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground mb-4">
            {activeCat.emoji} {activeCat.description} — <span className="text-foreground font-medium">{activeCat.items.length} mots</span>
          </motion.p>

          <motion.div key={`${activeCat.id}-${lang}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeCat.items.map((item, i) => {
              const isEditing = editingId === item.id;
              const isPlaying = playingId === item.id;
              const isRevealed = quizRevealed.has(item.id);
              const translation = item.translations[lang];
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`relative rounded-2xl border p-4 transition-all ${
                    isPlaying ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border bg-card/60 hover:border-primary/30"
                  }`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl block mb-1">{item.emoji}</span>
                    <span className="text-xs text-muted-foreground font-medium">{item.french}</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-sm h-8" autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveCorrection(item); if (e.key === "Escape") setEditingId(null); }} />
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
                        <button onClick={() => toggleQuizReveal(item.id)}
                          className="w-full py-2 rounded-lg bg-primary/10 border border-dashed border-primary/30 text-xs text-primary font-medium hover:bg-primary/20 transition-colors">
                          👀 Révéler
                        </button>
                      ) : (
                        <motion.p initial={quizMode ? { rotateY: 90 } : false} animate={{ rotateY: 0 }}
                          className="font-display font-bold text-foreground text-sm mb-2 cursor-pointer"
                          onClick={() => quizMode && toggleQuizReveal(item.id)}>
                          {translation}
                        </motion.p>
                      )}
                      {(!quizMode || isRevealed) && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <button onClick={() => speak(translation, item.id)}
                            className={`p-1.5 rounded-full transition-all ${isPlaying ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                            title="Écouter">
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditingId(item.id); setEditText(translation); }}
                            className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                            title="Corriger">
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
        </div>
      )}

      {/* ═══ TAB: CHAT ═══ */}
      {activeTab === "chat" && (
        <div className="container mx-auto px-4 pb-4 max-w-3xl flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground mb-3">
            💬 Discute en <span className="font-bold text-foreground">{LANG_META[lang].name}</span>. L'IA te répond dans cette langue. Corrige-la si elle se trompe !
          </p>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[50vh] rounded-2xl border border-border bg-card/30 p-4">
            {chatMessages.length === 0 && !chatLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Écris un message pour commencer la conversation</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {[
                    "Mbote ! Sango nini ?",
                    "Raconte-moi un conte",
                    "Apprends-moi à compter",
                    "Parle-moi de la RDC",
                  ].map((q) => (
                    <button key={q} onClick={() => { setChatInput(q); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <span className="text-lg mr-2 mt-1 shrink-0">📻</span>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && (
                      <button onClick={() => speakText(msg.content)}
                        className="mt-2 p-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                        title="Écouter">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {chatLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">L'IA réfléchit...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Écris en ${LANG_META[lang].name} ou en français...`}
              className="resize-none min-h-[44px] max-h-[100px] rounded-xl"
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            />
            <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} size="icon" className="rounded-xl shrink-0 h-11 w-11">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ TAB: INFOS & RADIO ═══ */}
      {activeTab === "news" && (
        <div className="container mx-auto px-4 pb-8 max-w-3xl flex-1">
          {/* Radio à la demande */}
          <div className="mb-6">
            <div className="rounded-2xl border border-border bg-card/60 p-5 relative overflow-hidden">
              {radioPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-pulse" />
              )}
              <div className="relative flex items-center gap-4">
                <div className="shrink-0">
                  <motion.div
                    animate={radioPlaying ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
                  >
                    <Radio className={`w-7 h-7 ${radioPlaying ? "text-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-sm mb-1">
                    📻 Radio AfriVoice — Infos en {LANG_META[lang].name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Clique pour lancer le journal en {LANG_META[lang].name} avec les vraies actualités du jour
                  </p>
                </div>
                <Button
                  onClick={startRadio}
                  variant={radioPlaying ? "destructive" : "default"}
                  size="sm"
                  disabled={radioLoading}
                  className="gap-2 rounded-full shrink-0"
                >
                  {radioLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                  ) : radioPlaying ? (
                    <>⏹ Arrêter</>
                  ) : (
                    <>▶ Lancer</>
                  )}
                </Button>
              </div>

              {/* Radio transcript */}
              {radioText && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-3 rounded-xl bg-background/50 border border-border max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">📝 Transcription en direct :</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{radioText}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Presse écrite */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> Presse du jour
            </h2>
            <Button variant="outline" size="sm" onClick={fetchNews} disabled={newsLoading} className="gap-2 rounded-full">
              {newsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "🔄"} Actualiser
            </Button>
          </div>

          {newsLoading && newsItems.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span className="text-sm">Chargement des actualités...</span>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune actualité disponible pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsItems.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card/60 p-4 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wide">{item.source}</span>
                      <h3 className="font-display font-bold text-foreground text-sm mt-1 leading-snug">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => speakText(item.title + ". " + item.description)}
                        className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                        title={`Écouter en ${LANG_META[lang].name}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-center"
                          title="Lire l'article">
                          <span className="text-xs">🔗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          🧒 Conçu pour les enfants de la diaspora — apprends avec tes parents !
          ✏️ Tu vois une erreur ? Corrige-la.
        </p>
      </div>
    </div>
  );
};

export default LearnPage;
