import { motion } from "framer-motion";
import { CheckCircle2, Clock, Circle } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    period: "Mois 1–3",
    status: "active",
    title: "Collecte & Pipeline",
    goals: [
      "200h audio brut par langue",
      "Pipeline de traitement automatique",
      "Scripts Colab autonomes",
      "Datasets format Hugging Face",
    ],
  },
  {
    phase: "Phase 2",
    period: "Mois 4–6",
    status: "upcoming",
    title: "Fine-tuning ASR",
    goals: [
      "Fine-tuning Whisper large-v3",
      "Annotation Label Studio",
      "Évaluation WER < 25%",
      "API /transcribe MVP",
    ],
  },
  {
    phase: "Phase 3",
    period: "Mois 7–9",
    status: "upcoming",
    title: "Chatbot & TTS",
    goals: [
      "Fine-tuning LLaMA 3",
      "Intégration Coqui XTTS-v2",
      "API /chat et /speak",
      "Interface web & mobile",
    ],
  },
  {
    phase: "Phase 4",
    period: "Mois 10–12",
    status: "upcoming",
    title: "Avatar & Scale",
    goals: [
      "Pipeline SadTalker + TTS",
      "API /avatar production",
      "Scaling à 20 000h/langue",
      "Déploiement Vertex AI",
    ],
  },
];

const statusIcon = (s: string) => {
  if (s === "active") return <Clock className="w-5 h-5 text-primary" />;
  return <Circle className="w-5 h-5 text-muted-foreground/30" />;
};

const RoadmapSection = () => {
  return (
    <section className="py-24 bg-gradient-surface">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Roadmap <span className="text-gradient-gold">12 mois</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {phases.map((p, i) => (
            <motion.div
              key={p.phase}
              className={`rounded-2xl border p-6 ${
                p.status === "active"
                  ? "border-primary/30 bg-primary/5 glow-primary"
                  : "border-border bg-card/30"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="flex items-center gap-2 mb-4">
                {statusIcon(p.status)}
                <div>
                  <div className="font-display font-bold text-foreground">{p.phase}</div>
                  <div className="text-xs text-muted-foreground">{p.period}</div>
                </div>
              </div>
              <h4 className="font-display font-semibold text-foreground mb-4">{p.title}</h4>
              <ul className="space-y-2">
                {p.goals.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary/40 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
