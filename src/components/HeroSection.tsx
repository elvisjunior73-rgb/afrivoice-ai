import { motion } from "framer-motion";
import { Mic, Globe, Brain } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm font-body text-primary">Phase 1 — Collecte de données en cours</span>
          </div>
        </motion.div>

        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <span className="text-gradient-hero">AfriVoice</span>{" "}
          <span className="text-foreground">AI</span>
        </motion.h1>

        <motion.p
          className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          La première plateforme d'IA conversationnelle en{" "}
          <span className="text-primary font-medium">Lingala</span>,{" "}
          <span className="text-accent font-medium">Kikongo</span> et{" "}
          <span className="text-secondary font-medium">Sango</span> — 
          donnant une voix numérique à plus de 60 millions de locuteurs.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          {[
            { icon: Mic, label: "Reconnaissance vocale", desc: "ASR multilingue" },
            { icon: Brain, label: "IA conversationnelle", desc: "Chatbot vocal & texte" },
            { icon: Globe, label: "3 langues africaines", desc: "Lingala · Kikongo · Sango" },
          ].map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="text-sm font-display font-semibold text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          {[
            { value: "60M+", label: "Locuteurs" },
            { value: "20K", label: "Heures cibles" },
            { value: "3", label: "Langues" },
            { value: "4", label: "Pays" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient-gold">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
