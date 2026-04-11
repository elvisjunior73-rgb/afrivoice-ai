import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

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
        <motion.h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-foreground">Une IA qui parle</span><br />
          <span className="text-gradient-hero">ta langue.</span>
        </motion.h1>

        <motion.div
          className="space-y-2 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="font-body text-lg md:text-xl text-muted-foreground">
            Testons-la.
          </p>
          <p className="font-body text-base text-muted-foreground/70">
            Parle. Elle écrit.
          </p>
          <p className="font-display text-sm text-primary font-medium tracking-wide">
            Qui sera le plus précis ?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <Link to="/chat">
            <Button
              size="lg"
              className="gap-3 text-lg font-display font-semibold rounded-full px-10 py-7 glow-primary hover-scale"
            >
              Lancer le test
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
