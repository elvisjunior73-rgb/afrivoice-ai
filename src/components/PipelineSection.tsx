import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Collecte", desc: "YouTube, TikTok, radio", tool: "yt-dlp · streamlink" },
  { num: "02", title: "Extraction", desc: "Conversion audio WAV/MP3", tool: "ffmpeg · pydub" },
  { num: "03", title: "Détection langue", desc: "Filtrage par langue cible", tool: "Whisper · langdetect" },
  { num: "04", title: "Segmentation", desc: "Découpage 5–30 secondes", tool: "silero-vad · librosa" },
  { num: "05", title: "Transcription", desc: "ASR automatique", tool: "Whisper large-v3" },
  { num: "06", title: "Nettoyage", desc: "Déduplication & qualité", tool: "soundfile · pandas" },
  { num: "07", title: "Annotation", desc: "Validation humaine", tool: "Label Studio" },
  { num: "08", title: "Fine-tuning", desc: "Entraînement modèle", tool: "Whisper · LLaMA 3" },
  { num: "09", title: "Évaluation", desc: "Mesure du WER", tool: "jiwer · evaluate" },
  { num: "10", title: "Déploiement", desc: "API de production", tool: "FastAPI · Cloud Run" },
];

const PipelineSection = () => {
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
            Pipeline <span className="text-gradient-gold">bout en bout</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            10 étapes automatisées, de la collecte audio brut au déploiement d'API de production.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="group relative rounded-xl border border-border bg-card/50 p-5 hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <span className="font-display text-3xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                {step.num}
              </span>
              <h4 className="font-display font-semibold text-foreground mt-2 mb-1">{step.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{step.desc}</p>
              <div className="text-[10px] font-mono text-primary/60 leading-tight">{step.tool}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PipelineSection;
