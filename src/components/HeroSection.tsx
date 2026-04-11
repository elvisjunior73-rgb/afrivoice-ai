import { motion } from "framer-motion";
import { Radio, BookOpen, Globe2, ArrowRight, Sparkles } from "lucide-react";
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
          <span className="text-foreground">, </span>
          <span className="text-gradient-hero">Kikongo</span>
          <span className="text-foreground">, </span>
          <span className="text-gradient-hero">Sango</span>
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

        {/* Language cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          {LANGUAGES.map((lang, i) => (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link to={`/chat?lang=${lang.code}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                  <span className="text-4xl block mb-3">{lang.flag}</span>
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">
                    {lang.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Écouter & corriger
                  </p>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                    <span>Lancer</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
