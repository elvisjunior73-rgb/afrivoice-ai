import { motion } from "framer-motion";
import { Mic, Globe, MessageSquare, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gradient-hero">AfriVoice</span>{" "}
          <span className="text-foreground">AI</span>
        </motion.h1>

        <motion.p
          className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          Parle en{" "}
          <span className="text-primary font-medium">Lingala</span>,{" "}
          <span className="text-accent font-medium">Kikongo</span> ou{" "}
          <span className="text-secondary font-medium">Sango</span> avec une IA — et aide à construire le futur des langues africaines.
        </motion.p>

        <motion.p
          className="font-body text-sm text-muted-foreground max-w-lg mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Chaque conversation améliore le modèle. Chaque correction compte. Deviens contributeur.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <Link to="/chat">
            <Button size="lg" className="gap-2 text-base font-display font-semibold rounded-full px-8 py-6 glow-primary">
              <MessageSquare className="w-5 h-5" />
              Commencer à parler
            </Button>
          </Link>
          <Link to="/chat">
            <Button size="lg" variant="outline" className="gap-2 text-base font-display rounded-full px-8 py-6">
              <Users className="w-5 h-5" />
              Contribuer au dataset
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            { icon: Mic, label: "Parle dans ta langue" },
            { icon: Globe, label: "Lingala · Kikongo · Sango" },
            { icon: Users, label: "Chaque utilisateur améliore l'IA" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/30 backdrop-blur-sm"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
