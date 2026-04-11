import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="text-6xl md:text-7xl">🤖</span>
        </motion.div>

        <motion.h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="text-foreground">Elle parle </span>
          <span className="text-gradient-hero">ta langue.</span>
        </motion.h1>

        <motion.p
          className="font-body text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto mb-3 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Une IA qui apprend le{" "}
          <span className="text-primary font-medium">Lingala</span>,{" "}
          le <span className="text-accent font-medium">Kikongo</span> et{" "}
          le <span className="text-secondary font-medium">Sango</span>.
        </motion.p>

        <motion.p
          className="font-body text-base text-muted-foreground/80 max-w-md mx-auto mb-12 italic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Elle est encore jeune. Parle-lui, elle a besoin de toi pour grandir.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          <Link to="/chat">
            <Button size="lg" className="gap-3 text-lg font-display font-semibold rounded-full px-10 py-7 glow-primary hover-scale">
              <MessageSquare className="w-6 h-6" />
              Commencer à parler
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
