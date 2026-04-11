import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, Edit3, Check, X, Sparkles, Send, Loader2, Newspaper, Radio, MessageSquare, BookOpen, Mic, MicOff, Lightbulb, Gamepad2 } from "lucide-react";
import QuizGame from "@/components/QuizGame";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
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
const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/afrivoice-transcribe`;

type Tab = "vocab" | "chat" | "news" | "quiz";
type ChatMsg = { role: "user" | "assistant"; content: string; transcription?: string };
type NewsItem = { title: string; description: string; link: string; source: string };

const SUGGESTIONS: Record<Language, string[]> = {
  lin: [
    "Mbote ! Sango nini lelo ?",
    "Lakisa ngai kotánga : moko, mibale, misato...",
    "Yebisá ngai lisolo ya kala",
    "Ndenge nini balobi 'merci' na Lingala ?",
    "Teyá ngai nkombo ya banyama",
  ],
  kon: [
    "Mbote ! Mambu mani lelo ?",
    "Longisa mono kutánga",
    "Tubila mono nsangu ya nsi",
    "Ndenge nini batubaka 'bonjour' na Kikongo ?",
    "Yekisa mono bansangu ya kala",
  ],
  sag: [
    "Bala mo ! Nyen tí lâ so ?",
    "Mä tene tí tánga",
    "Fa ngá tí alï-ngbängö",
    "Tongana lâ 'merci' na yângâ tí Sängö ?",
    "Mä tene tí ânyama",
  ],
};

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
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editMsgText, setEditMsgText] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { streamChat } = useStreamChat();
  const { isRecording, startRecording, stopRecording, audioDuration } = useAudioRecorder();
  const [transcribing, setTranscribing] = useState(false);

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
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

  const speakText = async (text: string) => {
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "lin" ? "fr-CD" : lang === "kon" ? "fr-CG" : "fr";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // ── Vocab corrections ──
  const saveCorrection = async (item: LearnItem) => {
    const corrected = editText.trim();
    if (!corrected || corrected === item.translations[lang]) { setEditingId(null); return; }
    const original = item.translations[lang];
    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: crypto.randomUUID(), language: lang, asr_text: original, corrected_text: corrected,
      is_corrected: true, is_validated: true, confidence_score: 0.5,
    }).select().single();
    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id, original_text: original, corrected_text: corrected, language: lang,
      });
    }
    item.translations[lang] = corrected;
    setEditingId(null);
    toast({ title: "Merci ! Correction enregistrée 🌱" });
  };

  const toggleQuizReveal = (id: string) => {
    setQuizRevealed(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  // ── Chat: send message ──
  const sendChat = async (text: string, transcription?: string) => {
    if (!text.trim() || chatLoading) return;
    setChatInput("");
    const userMsg: ChatMsg = { role: "user", content: text.trim(), transcription };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    await supabase.from("conversations").insert({
      session_id: sessionId, language: lang, role: "user", content: text.trim(),
    });

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
        onDone: async () => {
          setChatLoading(false);
          await supabase.from("conversations").insert({
            session_id: sessionId, language: lang, role: "assistant", content: assistantSoFar,
          });
        },
      });
    } catch (e: any) {
      setChatLoading(false);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  // ── Chat: push-to-talk ──
  const handlePushToTalk = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (!blob) return;
      setTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("language", lang);
        formData.append("session_id", sessionId);
        const resp = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Erreur transcription ${resp.status}`);
        }
        const result = await resp.json();
        const text = result.text || `[Audio ${audioDuration.toFixed(1)}s]`;
        setTranscribing(false);
        await sendChat(text, text);
      } catch (e: any) {
        setTranscribing(false);
        toast({ title: "Erreur micro", description: e.message, variant: "destructive" });
      }
    } else {
      await startRecording();
    }
  };

  // ── Chat: correct message ──
  const saveMsgCorrection = async (index: number) => {
    const original = chatMessages[index].content;
    const corrected = editMsgText.trim();
    if (!corrected || corrected === original) { setEditingMsgIdx(null); return; }

    setChatMessages(prev => prev.map((m, i) => i === index ? { ...m, content: corrected } : m));
    setEditingMsgIdx(null);

    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: sessionId, language: lang, asr_text: original, corrected_text: corrected,
      is_corrected: true, is_validated: true, confidence_score: 0.5,
    }).select().single();
    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id, original_text: original, corrected_text: corrected, language: lang,
      });
    }
    toast({ title: "Merci pour ta correction ! 🌱" });
  };

  // ── News ──
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const resp = await fetch(NEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ language: lang, mode: "headlines" }),
      });
      if (resp.ok) { const data = await resp.json(); setNewsItems(data.items || []); }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setNewsLoading(false);
  };

  const startRadio = async () => {
    if (radioPlaying) { setRadioPlaying(false); setRadioText(""); return; }
    setRadioLoading(true); setRadioPlaying(true); setRadioText("");
    try {
      const resp = await fetch(NEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ language: lang, mode: "radio" }),
      });
      if (!resp.ok || !resp.body) throw new Error("Erreur radio");
      setRadioLoading(false);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx); buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) { full += c; setRadioText(full); } } catch {}
        }
      }
      if (full) speakText(full);
    } catch (e: any) { toast({ title: "Erreur radio", description: e.message, variant: "destructive" }); }
    setRadioLoading(false);
  };

  useEffect(() => { if (activeTab === "news" && newsItems.length === 0) fetchNews(); }, [activeTab]);

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "vocab", icon: <BookOpen className="w-4 h-4" />, label: "Vocabulaire" },
    { id: "quiz", icon: <Gamepad2 className="w-4 h-4" />, label: "Quiz" },
    { id: "chat", icon: <Mic className="w-4 h-4" />, label: "Parler" },
    { id: "news", icon: <Newspaper className="w-4 h-4" />, label: "Infos & Radio" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Apprendre en jouant
              </h1>
              <p className="text-[11px] text-muted-foreground">Vocabulaire, conversation vocale, infos en langues africaines</p>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
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
          <div className="flex items-center justify-end mb-4">
            <Button variant={quizMode ? "default" : "outline"} size="sm"
              onClick={() => { setQuizMode(!quizMode); setQuizRevealed(new Set()); }} className="gap-2 rounded-full">
              🎮 {quizMode ? "Mode normal" : "Mode quiz"}
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => { setActiveCat(cat); setQuizRevealed(new Set()); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
                  activeCat.id === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card/50 border-border text-muted-foreground hover:border-primary/30"
                }`}>
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </div>
          <motion.p key={activeCat.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-muted-foreground mb-4">
            {activeCat.emoji} {activeCat.description} — <span className="text-foreground font-medium">{activeCat.items.length} mots</span>
          </motion.p>
          <motion.div key={`${activeCat.id}-${lang}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeCat.items.map((item, i) => {
              const isEditing = editingId === item.id;
              const isPlaying = playingId === item.id;
              const isRevealed = quizRevealed.has(item.id);
              const translation = item.translations[lang];
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
                  className={`relative rounded-2xl border p-4 transition-all ${isPlaying ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border bg-card/60 hover:border-primary/30"}`}>
                  <div className="text-center mb-2">
                    <span className="text-3xl block mb-1">{item.emoji}</span>
                    <span className="text-xs text-muted-foreground font-medium">{item.french}</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-sm h-8" autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveCorrection(item); if (e.key === "Escape") setEditingId(null); }} />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-xs flex-1 gap-1" onClick={() => saveCorrection(item)}><Check className="w-3 h-3" /> OK</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {quizMode && !isRevealed ? (
                        <button onClick={() => toggleQuizReveal(item.id)} className="w-full py-2 rounded-lg bg-primary/10 border border-dashed border-primary/30 text-xs text-primary font-medium hover:bg-primary/20 transition-colors">👀 Révéler</button>
                      ) : (
                        <motion.p initial={quizMode ? { rotateY: 90 } : false} animate={{ rotateY: 0 }} className="font-display font-bold text-foreground text-sm mb-2 cursor-pointer" onClick={() => quizMode && toggleQuizReveal(item.id)}>{translation}</motion.p>
                      )}
                      {(!quizMode || isRevealed) && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <button onClick={() => speak(translation, item.id)} className={`p-1.5 rounded-full transition-all ${isPlaying ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"}`} title="Écouter"><Volume2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditingId(item.id); setEditText(translation); }} className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all" title="Corriger"><Edit3 className="w-3.5 h-3.5" /></button>
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

      {/* ═══ TAB: PARLER (Voice-first Chat) ═══ */}
      {activeTab === "chat" && (
        <div className="container mx-auto px-4 pb-4 max-w-3xl flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground mb-3">
            🎙️ Parle en <span className="font-bold text-foreground">{LANG_META[lang].name}</span> — l'IA te répond. Corrige la transcription et les réponses si besoin !
          </p>

          {/* Suggestions */}
          {chatMessages.length === 0 && !chatLoading && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Suggestions — essaie de dire :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS[lang].map((s) => (
                  <button key={s} onClick={() => sendChat(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[50vh] rounded-2xl border border-border bg-card/30 p-4">
            {chatMessages.length === 0 && !chatLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Appuie sur le micro pour parler</p>
                <p className="text-xs mt-1">ou tape un message en dessous</p>
              </div>
            )}
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <span className="text-lg mr-2 mt-1 shrink-0">📻</span>}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
                  }`}>
                    {editingMsgIdx === i ? (
                      <div className="space-y-2">
                        <Textarea value={editMsgText} onChange={(e) => setEditMsgText(e.target.value)}
                          className="text-sm min-h-[60px] bg-background text-foreground" autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveMsgCorrection(i); } if (e.key === "Escape") setEditingMsgIdx(null); }} />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-xs flex-1 gap-1" onClick={() => saveMsgCorrection(i)}><Check className="w-3 h-3" /> Corriger</Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingMsgIdx(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.transcription && msg.role === "user" && (
                          <p className="text-[10px] mt-1 opacity-70">🎙️ Transcription vocale</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {msg.role === "assistant" && (
                            <button onClick={() => speakText(msg.content)}
                              className="p-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all" title="Écouter">
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => { setEditingMsgIdx(i); setEditMsgText(msg.content); }}
                            className={`p-1 rounded-full transition-all ${
                              msg.role === "user" ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`} title="Corriger">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(chatLoading || transcribing) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{transcribing ? "Transcription en cours..." : "L'IA réfléchit..."}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Voice + Text input */}
          <div className="flex items-end gap-2">
            {/* Big mic button */}
            <motion.button
              onClick={handlePushToTalk}
              disabled={chatLoading || transcribing}
              whileTap={{ scale: 0.9 }}
              className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse shadow-destructive/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
              } disabled:opacity-50`}
              title={isRecording ? "Arrêter l'enregistrement" : "Maintenir pour parler"}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>

            <div className="flex-1 flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ou tape en ${LANG_META[lang].name}...`}
                className="resize-none min-h-[44px] max-h-[80px] rounded-xl text-sm"
                rows={1}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
              />
              <Button onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim()} size="icon" className="rounded-xl shrink-0 h-11 w-11">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isRecording && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-destructive mt-2 font-medium">
              🔴 Enregistrement en cours… Clique à nouveau pour arrêter
            </motion.p>
          )}

          {/* WhatsApp notice */}
          <div className="mt-4 p-3 rounded-xl border border-border bg-card/40 text-center">
            <p className="text-xs text-muted-foreground">
              📱 <span className="font-medium text-foreground">Bientôt sur WhatsApp</span> — Contribue directement par message vocal WhatsApp. Reste connecté !
            </p>
          </div>
        </div>
      )}

      {/* ═══ TAB: INFOS & RADIO ═══ */}
      {activeTab === "news" && (
        <div className="container mx-auto px-4 pb-8 max-w-3xl flex-1">
          {/* Radio */}
          <div className="mb-6">
            <div className="rounded-2xl border border-border bg-card/60 p-5 relative overflow-hidden">
              {radioPlaying && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-pulse" />}
              <div className="relative flex items-center gap-4">
                <motion.div animate={radioPlaying ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 2 }}
                  className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
                  <Radio className={`w-7 h-7 ${radioPlaying ? "text-primary" : "text-muted-foreground"}`} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-sm mb-1">📻 Radio AfriVoice — Infos en {LANG_META[lang].name}</h3>
                  <p className="text-xs text-muted-foreground">Clique pour lancer le journal en {LANG_META[lang].name}</p>
                </div>
                <Button onClick={startRadio} variant={radioPlaying ? "destructive" : "default"} size="sm" disabled={radioLoading} className="gap-2 rounded-full shrink-0">
                  {radioLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</> : radioPlaying ? <>⏹ Arrêter</> : <>▶ Lancer</>}
                </Button>
              </div>
              {radioText && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-3 rounded-xl bg-background/50 border border-border max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">📝 Transcription en direct :</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{radioText}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Press */}
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
              <Loader2 className="w-6 h-6 animate-spin mr-3" /><span className="text-sm">Chargement des actualités...</span>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune actualité disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {newsItems.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card/60 p-4 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wide">{item.source}</span>
                      <h3 className="font-display font-bold text-foreground text-sm mt-1 leading-snug">{item.title}</h3>
                      {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => speakText(item.title + ". " + item.description)}
                        className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all" title={`Écouter en ${LANG_META[lang].name}`}>
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-center" title="Lire l'article">
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
          🧒 Conçu pour la diaspora — apprends avec tes parents ! ✏️ Corrige les erreurs pour améliorer l'IA.
        </p>
      </div>
    </div>
  );
};

export default LearnPage;
