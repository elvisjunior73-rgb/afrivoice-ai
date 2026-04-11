import { motion, AnimatePresence } from "framer-motion";
import { Radio, ArrowRight, Sparkles, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useState } from "react";

const LANGUAGES = [
  { code: "lin", name: "Lingala", flag: "🇨🇩" },
  { code: "kon", name: "Kikongo", flag: "🇦🇴" },
  { code: "sag", name: "Sango", flag: "🇨🇫" },
];

const HeroSection = () => {
  const [showPicker, setShowPicker] = useState(false);
  const navigate = useNavigate();

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
          className="font-body text-sm text-muted-foreground/70 max-w-md mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          Elle fait des erreurs. Corrige-la. Tu l'aides à devenir meilleure.
        </motion.p>

        {/* Central CTA card */}
        <motion.div
          className="relative max-w-lg mx-auto mb-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full group relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-card/80 backdrop-blur-md p-8 hover:border-primary/60 transition-all hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-4">
              <MessageCircle className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-display text-2xl font-bold text-foreground">On échange ?</p>
                <p className="text-sm text-muted-foreground mt-1">Choisis ta langue et lance la conversation</p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Language picker dropdown */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-3 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-4 z-20"
              >
                <div className="flex items-center justify-between mb-3 px-2">
                  <p className="text-sm font-medium text-muted-foreground">Choisis ta langue</p>
                  <button onClick={() => setShowPicker(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => navigate(`/chat?lang=${lang.code}`)}
                      className="flex-1 group/lang rounded-xl border border-border bg-background/60 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <span className="text-3xl block mb-2">{lang.flag}</span>
                      <p className="font-display font-bold text-foreground text-sm">{lang.name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Horizontal language tags */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          {LANGUAGES.map((lang, i) => (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              <Link to={`/chat?lang=${lang.code}`}>
                <div className="group inline-flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md cursor-pointer">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-display font-bold text-foreground text-sm">{lang.name}</span>
                  <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Learn section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Link to="/apprendre">
            <div className="group inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer">
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-display font-bold text-foreground text-sm">🧒 Apprendre en jouant</p>
                <p className="text-xs text-muted-foreground">Alphabet, nombres, animaux — pour les enfants de la diaspora</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
