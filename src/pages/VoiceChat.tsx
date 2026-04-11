import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Check, Edit3, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useStreamChat } from "@/hooks/useStreamChat";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Language = "lin" | "kon" | "sag";
type Msg = { role: "user" | "assistant"; content: string };

const LANGUAGES: Record<Language, { name: string; flag: string; welcome: string; placeholder: string }> = {
  lin: {
    name: "Lingala",
    flag: "🇨🇩",
    welcome: "Mbote! 👋 Ngai nazali koyekola Lingala. Salisa ngai!",
    placeholder: "Komela na Lingala...",
  },
  kon: {
    name: "Kikongo",
    flag: "🇦🇴",
    welcome: "Mbote! 👋 Mono ke longuka Kikongo. Sadisa mono!",
    placeholder: "Sonika na Kikongo...",
  },
  sag: {
    name: "Sango",
    flag: "🇨🇫",
    welcome: "Bala mo! 👋 Mbi yeke kua Sango. Mou mbi!",
    placeholder: "Sara na Sango...",
  },
};

const CORRECTION_REACTIONS = [
  "Merci ! J'ai appris quelque chose 🧠",
  "Ah d'accord, je note ! ✍️",
  "Je ferai mieux la prochaine fois 💪",
  "Tu es un bon professeur ! 🙏",
  "C'est noté, merci de m'aider à grandir 🌱",
];

const VoiceChat = () => {
  const [language, setLanguage] = useState<Language>("lin");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [started, setStarted] = useState(false);

  // Correction state (invisible contribution)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Text input
  const [textInput, setTextInput] = useState("");

  const { isRecording, startRecording, stopRecording, audioDuration } = useAudioRecorder();
  const { streamChat } = useStreamChat();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = (lang: Language) => {
    setLanguage(lang);
    setStarted(true);
    setMessages([{ role: "assistant", content: LANGUAGES[lang].welcome }]);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    const simulatedText = `[Audio ${audioDuration.toFixed(1)}s — ${LANGUAGES[language].name}]`;

    await supabase.from("voice_interactions").insert({
      session_id: sessionId,
      language,
      audio_duration_seconds: audioDuration,
      asr_text: simulatedText,
      confidence_score: 0.75,
    });

    await sendMessage(simulatedText);
  };

  const sendMessage = async (text: string) => {
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
      if (blob) await handleRecordingComplete(blob);
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

  const handleStartCorrection = (index: number) => {
    setEditingIndex(index);
    setEditText(messages[index].content);
  };

  const handleSaveCorrection = async (index: number) => {
    const original = messages[index].content;
    const corrected = editText.trim();
    if (!corrected || corrected === original) {
      setEditingIndex(null);
      return;
    }

    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, content: corrected } : m)));
    setEditingIndex(null);

    // Silently save correction as gold data
    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: sessionId, language,
      asr_text: original, corrected_text: corrected,
      is_corrected: true, is_validated: true, confidence_score: 0.5,
    }).select().single();

    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id,
        original_text: original, corrected_text: corrected, language,
      });
    }

    // Playful reaction — the AI "learns"
    const reaction = CORRECTION_REACTIONS[Math.floor(Math.random() * CORRECTION_REACTIONS.length)];
    toast({ title: reaction });
  };

  // ─── Language selection screen ───
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Link to="/" className="absolute top-4 left-4">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-10"
        >
          <span className="text-7xl mb-4 block">🤖</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Dans quelle langue veux-tu me parler ?
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Je suis encore en train d'apprendre. Plus tu me parles, plus je m'améliore.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES["lin"]][]).map(([code, lang]) => (
            <Button
              key={code}
              size="lg"
              variant="outline"
              onClick={() => startConversation(code)}
              className="gap-3 text-lg font-display rounded-2xl px-8 py-8 hover-scale border-2 hover:border-primary/50"
            >
              <span className="text-3xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </Button>
          ))}
        </motion.div>
      </div>
    );
  }

  // ─── Chat screen ───
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setStarted(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h1 className="font-display text-sm font-bold text-foreground">
                  AfriVoice <span className="text-primary">· {LANGUAGES[language].name}</span>
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  En train d'apprendre... aide-moi !
                </p>
              </div>
            </div>
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1">
            {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES["lin"]][]).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`text-xl p-1.5 rounded-lg transition-all ${
                  language === code ? "bg-primary/10 scale-110" : "opacity-50 hover:opacity-80"
                }`}
              >
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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <span className="text-xl mr-2 mt-1 shrink-0">🤖</span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                }`}
              >
                {editingIndex === i ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[50px] text-sm bg-background/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveCorrection(i)} className="gap-1 text-xs">
                        <Check className="w-3 h-3" /> C'est mieux comme ça
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)} className="text-xs">
                        Non, laisse
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleStartCorrection(i)}
                        className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1.5 shadow-sm"
                        title="Corriger"
                      >
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
            <span className="text-xl mr-2 mt-1">🤖</span>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Je réfléchis...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={LANGUAGES[language].placeholder}
              className="min-h-[44px] max-h-[120px] resize-none pr-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSend();
                }
              }}
            />
            {textInput.trim() && (
              <Button
                size="icon"
                className="absolute bottom-1.5 right-1.5 h-8 w-8"
                onClick={handleTextSend}
                disabled={isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={`rounded-full w-14 h-14 p-0 shrink-0 ${isRecording ? "animate-pulse" : ""}`}
              onClick={handlePushToTalk}
              disabled={isLoading}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          </motion.div>
        </div>

        {isRecording && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-xs text-destructive mt-2 font-medium">
            🔴 Je t'écoute... Clique pour arrêter
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
