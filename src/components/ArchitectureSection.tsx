import { motion } from "framer-motion";
import { ArrowRight, Mic, MessageSquare, Volume2, Video, Radio } from "lucide-react";

const endpoints = [
  { method: "POST", path: "/transcribe", icon: Mic, input: "Audio", output: "Texte", desc: "Reconnaissance vocale ASR" },
  { method: "POST", path: "/chat", icon: MessageSquare, input: "Texte", output: "Réponse LLM", desc: "Chatbot conversationnel" },
  { method: "POST", path: "/speak", icon: Volume2, input: "Texte", output: "Audio", desc: "Synthèse vocale TTS" },
  { method: "POST", path: "/avatar", icon: Video, input: "Texte + Image", output: "Vidéo", desc: "Avatar IA parlant" },
  { method: "WS", path: "/stream", icon: Radio, input: "Audio stream", output: "Temps réel", desc: "Conversation vocale live" },
];

const ArchitectureSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Architecture <span className="text-gradient-hero">API</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Cinq endpoints pour couvrir l'intégralité du cycle conversationnel multilingue.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {endpoints.map((ep, i) => (
            <motion.div
              key={ep.path}
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card/50 hover:border-primary/20 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <ep.icon className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${ep.method === "WS" ? "bg-secondary/20 text-secondary" : "bg-primary/10 text-primary"}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm text-foreground">{ep.path}</span>
                </div>
                <p className="text-xs text-muted-foreground">{ep.desc}</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <span className="px-2 py-1 rounded bg-muted">{ep.input}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="px-2 py-1 rounded bg-muted">{ep.output}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
