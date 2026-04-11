import { motion } from "framer-motion";
import { Radio, BookOpen, Globe2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const LANGUAGES = [
  { code: "lin", name: "Lingala", flag: "🇨🇩", accent: "primary" },
  { code: "kon", name: "Kikongo", flag: "🇦🇴", accent: "accent" },
  { code: "sag", name: "Sango", flag: "🇨🇫", accent: "secondary" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
        >
          <Radio className="w-4 h-4 text-primary" />
          <span className="text-sm font-body text-primary">L'info, les contes, l'histoire — dans ta langue</span>
        </motion.div>

        <motion.h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="text-foreground">Et si l'actualité mondiale</span><br />
          <span className="text-foreground">était racontée en </span>
          <span className="text-gradient-hero">Lingala</span>
          <span className="text-foreground"> ?</span>
        </motion.h1>

        <motion.p
          className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Une IA lit les infos, raconte des contes, parle d'histoire et d'économie
          — en <span className="text-primary font-medium">Lingala</span>,{" "}
          <span className="text-accent font-medium">Kikongo</span> et{" "}
          <span className="text-secondary font-medium">Sango</span>.
        </motion.p>

        <motion.p
          className="font-body text-sm text-muted-foreground/70 max-w-md mx-auto mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          Elle fait des erreurs. Corrige-la. Tu l'aides à devenir meilleure.
        </motion.p>

        {/* Topic pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          {TOPICS.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/40 backdrop-blur-sm"
            >
              <span className="text-base">{t.icon}</span>
              <span className="text-sm text-muted-foreground">{t.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link to="/chat">
            <Button
              size="lg"
              className="gap-3 text-lg font-display font-semibold rounded-full px-10 py-7 glow-primary hover-scale"
            >
              Écouter & corriger
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
