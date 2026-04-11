import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Check, Edit3, ArrowLeft, Loader2, Radio, BookOpen, Globe2, TrendingUp, Swords, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useStreamChat } from "@/hooks/useStreamChat";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";

type Language = "lin" | "kon" | "sag";
type Msg = { role: "user" | "assistant"; content: string };

interface Topic {
  id: string;
  icon: string;
  label: string;
  prompt: string;
}

const LANGUAGES: Record<Language, { name: string; flag: string; placeholder: string }> = {
  lin: { name: "Lingala", flag: "🇨🇩", placeholder: "Komela na Lingala..." },
  kon: { name: "Kikongo", flag: "🇦🇴", placeholder: "Sonika na Kikongo..." },
  sag: { name: "Sango", flag: "🇨🇫", placeholder: "Sara na Sango..." },
};

const TOPICS: Topic[] = [
  { id: "news", icon: "📻", label: "Actualités du jour", prompt: "Lis-moi les actualités du jour de la RDC et d'Afrique centrale comme un présentateur radio." },
  { id: "tales", icon: "📖", label: "Conte africain", prompt: "Raconte-moi un conte traditionnel africain, une histoire avec une morale." },
  { id: "history", icon: "🌍", label: "Histoire mondiale", prompt: "Parle-moi d'un événement marquant de l'histoire mondiale. La deuxième guerre mondiale, la guerre froide, l'indépendance des pays africains, choisis un sujet fascinant." },
  { id: "economy", icon: "💰", label: "Économie & défis", prompt: "Parle-moi de l'économie et des défis actuels de la RDC et de l'Afrique centrale." },
  { id: "culture", icon: "🎵", label: "Musique & culture", prompt: "Parle-moi de la musique congolaise, des artistes, de la rumba, de la culture musicale d'Afrique centrale." },
  { id: "sport", icon: "⚽", label: "Sport", prompt: "Parle-moi des actualités sportives : football africain, les Léopards, la CAN, les joueurs congolais en Europe." },
  { id: "proverbs", icon: "🧠", label: "Proverbes & sagesse", prompt: "Apprends-moi un proverbe ou une expression de sagesse. Explique sa signification et son contexte." },
  { id: "science", icon: "🔬", label: "Science & nature", prompt: "Parle-moi d'une découverte scientifique fascinante ou de la nature incroyable du bassin du Congo." },
];

const CORRECTION_REACTIONS = [
  "Merci ! J'ai noté 🧠",
  "Ah ! Je disais mal, pardon ✍️",
  "Tu es mon meilleur professeur 🙏",
  "Je ferai mieux la prochaine fois 💪",
  "C'est noté ! 🌱",
];

const VoiceChat = () => {
  const [searchParams] = useSearchParams();
  const langParam = searchParams.get("lang") as Language | null;
  const validLangs: Language[] = ["lin", "kon", "sag"];
  const initialLang = langParam && validLangs.includes(langParam) ? langParam : null;
  
  const [language, setLanguage] = useState<Language | null>(initialLang);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Correction
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [textInput, setTextInput] = useState("");

  const { isRecording, startRecording, stopRecording, audioDuration } = useAudioRecorder();
  const { streamChat } = useStreamChat();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const launchTopic = async (topic: Topic, lang: Language) => {
    setLanguage(lang);
    setSelectedTopic(topic);
    // Send the topic prompt as the first user message (hidden) and get AI response
    const userMsg: Msg = { role: "user", content: topic.prompt };
    setMessages([]);
    setIsLoading(true);

    await supabase.from("conversations").insert({
      session_id: sessionId, language: lang, role: "user", content: topic.prompt,
    });

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [userMsg],
        language: lang,
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsLoading(false);
          await supabase.from("conversations").insert({
            session_id: sessionId, language: lang, role: "assistant", content: assistantSoFar,
          });
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Oups", description: e.message, variant: "destructive" });
    }
  };

  const sendMessage = async (text: string) => {
    if (!language) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    await supabase.from("conversations").insert({
      session_id: sessionId, language, role: "user", content: text,
    });

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        language,
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsLoading(false);
          await supabase.from("conversations").insert({
            session_id: sessionId, language, role: "assistant", content: assistantSoFar,
          });
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Oups", description: e.message, variant: "destructive" });
    }
  };

  const handlePushToTalk = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        const simulatedText = `[Audio ${audioDuration.toFixed(1)}s — ${LANGUAGES[language!].name}]`;
        await supabase.from("voice_interactions").insert({
          session_id: sessionId, language: language!, audio_duration_seconds: audioDuration,
          asr_text: simulatedText, confidence_score: 0.75,
        });
        await sendMessage(simulatedText);
      }
    } else {
      await startRecording();
    }
  };

  const handleTextSend = async () => {
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput("");
    await sendMessage(text);
  };

  const handleSaveCorrection = async (index: number) => {
    const original = messages[index].content;
    const corrected = editText.trim();
    if (!corrected || corrected === original) { setEditingIndex(null); return; }

    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, content: corrected } : m)));
    setEditingIndex(null);

    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: sessionId, language: language!,
      asr_text: original, corrected_text: corrected,
      is_corrected: true, is_validated: true, confidence_score: 0.5,
    }).select().single();

    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id,
        original_text: original, corrected_text: corrected, language: language!,
      });
    }

    const reaction = CORRECTION_REACTIONS[Math.floor(Math.random() * CORRECTION_REACTIONS.length)];
    toast({ title: reaction });
  };

  // ─── STEP 1: Choose language ───
  if (!language) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Link to="/" className="absolute top-4 left-4">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-10">
          <span className="text-6xl mb-4 block">📻</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Choisis ta langue
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            L'IA va te parler dans cette langue. Si elle se trompe, corrige-la.
          </p>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES["lin"]][]).map(([code, lang]) => (
            <Button key={code} size="lg" variant="outline" onClick={() => setLanguage(code)}
              className="gap-3 text-lg font-display rounded-2xl px-8 py-8 hover-scale border-2 hover:border-primary/50">
              <span className="text-3xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </Button>
          ))}
        </motion.div>
      </div>
    );
  }

  // ─── STEP 2: Choose topic (if no topic selected yet) ───
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-6">
        <header className="py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setLanguage(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{LANGUAGES[language].flag}</span>
            <span className="font-display font-bold text-foreground">{LANGUAGES[language].name}</span>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              De quoi veux-tu qu'on parle ?
            </h2>
            <p className="text-sm text-muted-foreground">
              Choisis un sujet. L'IA te raconte — en {LANGUAGES[language].name}.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-2 gap-3 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {TOPICS.map((topic, i) => (
              <motion.button
                key={topic.id}
                onClick={() => launchTopic(topic, language)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{topic.icon}</span>
                <span className="text-sm font-display font-medium text-foreground">{topic.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Chat ───
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedTopic(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedTopic.icon}</span>
              <div>
                <h1 className="font-display text-sm font-bold text-foreground">
                  {selectedTopic.label}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  {LANGUAGES[language].flag} en {LANGUAGES[language].name} · Corrige si elle se trompe
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES["lin"]][]).map(([code, lang]) => (
              <button key={code} onClick={() => { setLanguage(code); launchTopic(selectedTopic, code); }}
                className={`text-lg p-1.5 rounded-lg transition-all ${language === code ? "bg-primary/10 scale-110" : "opacity-40 hover:opacity-70"}`}>
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <span className="text-xl mr-2 mt-1 shrink-0">📻</span>}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              }`}>
                {editingIndex === i ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[50px] text-sm bg-background/50" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveCorrection(i)} className="gap-1 text-xs">
                        <Check className="w-3 h-3" /> C'est mieux
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)} className="text-xs">
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === "assistant" && (
                      <button onClick={() => { setEditingIndex(i); setEditText(msg.content); }}
                        className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1.5 shadow-sm"
                        title="Corriger">
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-start">
            <span className="text-xl mr-2 mt-1">📻</span>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>En direct...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick topic switch */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto py-2 scrollbar-hide">
            {TOPICS.filter(t => t.id !== selectedTopic.id).slice(0, 4).map((t) => (
              <button key={t.id} onClick={() => launchTopic(t, language)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors whitespace-nowrap shrink-0">
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
              placeholder={LANGUAGES[language].placeholder}
              className="min-h-[44px] max-h-[120px] resize-none pr-10 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }} />
            {textInput.trim() && (
              <Button size="icon" className="absolute bottom-1.5 right-1.5 h-8 w-8" onClick={handleTextSend} disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button size="lg" variant={isRecording ? "destructive" : "default"}
              className={`rounded-full w-14 h-14 p-0 shrink-0 ${isRecording ? "animate-pulse" : ""}`}
              onClick={handlePushToTalk} disabled={isLoading}>
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          </motion.div>
        </div>
        {isRecording && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-destructive mt-2 font-medium">
            🔴 Je t'écoute...
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
