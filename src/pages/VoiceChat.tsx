import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Check, Edit3, Globe, ArrowLeft, Volume2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useStreamChat } from "@/hooks/useStreamChat";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Language = "lin" | "kon" | "sag";
type Msg = { role: "user" | "assistant"; content: string };

const LANGUAGES: Record<Language, { name: string; flag: string; greeting: string }> = {
  lin: { name: "Lingala", flag: "🇨🇩", greeting: "Mbote! Lobela na Lingala..." },
  kon: { name: "Kikongo", flag: "🇦🇴", greeting: "Mbote! Yoba na Kikongo..." },
  sag: { name: "Sango", flag: "🇨🇫", greeting: "Bala mo! Tene na Sango..." },
};

const VoiceChat = () => {
  const [language, setLanguage] = useState<Language>("lin");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Correction state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [correctionsSaved, setCorrectionsSaved] = useState(0);

  // Text input mode
  const [textInput, setTextInput] = useState("");

  const { isRecording, startRecording, stopRecording, audioDuration } = useAudioRecorder();
  const { streamChat } = useStreamChat();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate ASR transcription (in real MVP, this would call Whisper)
  const handleRecordingComplete = async (blob: Blob) => {
    // For MVP: we use a placeholder transcription since we can't run Whisper in-browser
    // In production, this would upload audio to an edge function running Whisper
    const simulatedText = `[Audio enregistré - ${audioDuration.toFixed(1)}s en ${LANGUAGES[language].name}]`;
    
    // Save voice interaction to DB
    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: sessionId,
      language,
      audio_duration_seconds: audioDuration,
      asr_text: simulatedText,
      confidence_score: 0.75,
    }).select().single();

    // Add user message and get AI response
    await sendMessage(simulatedText);
  };

  const sendMessage = async (text: string) => {
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Save user message to conversations
    await supabase.from("conversations").insert({
      session_id: sessionId,
      language,
      role: "user",
      content: text,
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
          // Save assistant message
          await supabase.from("conversations").insert({
            session_id: sessionId,
            language,
            role: "assistant",
            content: assistantSoFar,
          });
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
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

    // Update message in UI
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, content: corrected } : m)));
    setEditingIndex(null);

    // Save to voice_interactions as correction
    const { data: interaction } = await supabase.from("voice_interactions").insert({
      session_id: sessionId,
      language,
      asr_text: original,
      corrected_text: corrected,
      is_corrected: true,
      is_validated: true,
      confidence_score: 0.5,
    }).select().single();

    // Save to gold_dataset
    if (interaction) {
      await supabase.from("gold_dataset").insert({
        interaction_id: interaction.id,
        original_text: original,
        corrected_text: corrected,
        language,
      });
    }

    setCorrectionsSaved((c) => c + 1);
    toast({
      title: "✨ Correction enregistrée !",
      description: "Merci ! Chaque correction améliore le modèle.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-base font-bold text-foreground">
                AfriVoice <span className="text-primary">Chat</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Parle, corrige, améliore le modèle
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES["lin"]][]).map(([code, lang]) => (
              <Button
                key={code}
                variant={language === code ? "default" : "ghost"}
                size="sm"
                onClick={() => setLanguage(code)}
                className="text-xs gap-1"
              >
                <span>{lang.flag}</span>
                <span className="hidden sm:inline">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats bar */}
      {correctionsSaved > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
          <span className="text-xs text-primary font-medium">
            🏆 {correctionsSaved} correction{correctionsSaved > 1 ? "s" : ""} contribuée{correctionsSaved > 1 ? "s" : ""} au Gold Dataset
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {LANGUAGES[language].greeting}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Parle ou écris en <strong>{LANGUAGES[language].name}</strong>. 
              L'IA te répond, et tu peux corriger ses transcriptions pour améliorer le modèle.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Badge variant="outline" className="text-xs">🎤 Push-to-talk</Badge>
              <Badge variant="outline" className="text-xs">✏️ Corrige</Badge>
              <Badge variant="outline" className="text-xs">📊 Gold Dataset</Badge>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {editingIndex === i ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px] text-sm bg-background/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveCorrection(i)} className="gap-1">
                        <Check className="w-3 h-3" /> Valider
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "user" && (
                      <button
                        onClick={() => handleStartCorrection(i)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1"
                        title="Corriger cette transcription"
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Écris en ${LANGUAGES[language].name}...`}
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

          {/* Push-to-talk button */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={`rounded-full w-14 h-14 p-0 shrink-0 ${
                isRecording ? "animate-pulse" : ""
              }`}
              onClick={handlePushToTalk}
              disabled={isLoading}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </motion.div>
        </div>

        {isRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-destructive mt-2 font-medium"
          >
            🔴 Enregistrement en cours... Clique pour arrêter
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
