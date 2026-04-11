import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

const languages = [
  {
    name: "Lingala",
    iso: "lin",
    countries: "RDC, Congo-Brazzaville",
    speakers: "~45M",
    resources: ["OpenSLR (4h)", "Radio Corpus (741h)", "WAXAL Google", "OPUS Bible"],
    color: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
  },
  {
    name: "Kikongo",
    iso: "kon",
    countries: "RDC, Angola, Congo",
    speakers: "~10M",
    resources: ["JW300 Corpus", "OPUS Bible", "AfroLingu-MT"],
    color: "text-accent",
    border: "border-accent/20",
    bg: "bg-accent/5",
  },
  {
    name: "Sango",
    iso: "sag",
    countries: "République Centrafricaine",
    speakers: "~5M",
    resources: ["OPUS Bible", "Mozilla Common Voice", "Masakhane NLP"],
    color: "text-secondary",
    border: "border-secondary/20",
    bg: "bg-secondary/5",
  },
];

const LanguagesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Trois langues.{" "}
            <span className="text-gradient-hero">Un même droit</span> à l'IA.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Des langues parlées par des dizaines de millions de personnes, 
            aujourd'hui quasi-absentes de l'écosystème mondial de l'intelligence artificielle.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {languages.map((lang, i) => (
            <motion.div
              key={lang.iso}
              className={`rounded-2xl border ${lang.border} ${lang.bg} p-8 backdrop-blur-sm`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-display text-2xl font-bold ${lang.color}`}>{lang.name}</h3>
                <span className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">
                  ISO: {lang.iso}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {lang.countries}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {lang.speakers} locuteurs
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ressources identifiées</div>
                <div className="flex flex-wrap gap-2">
                  {lang.resources.map((r) => (
                    <span key={r} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguagesSection;
