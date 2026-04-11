import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, RotateCcw, ArrowRight, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  type Language,
  type LearnItem,
  type Category,
  LANG_META,
  CATEGORIES,
} from "@/data/learnData";

interface QuizGameProps {
  lang: Language;
}

type QuizState = "menu" | "playing" | "result";

interface Question {
  item: LearnItem;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(cat: Category, lang: Language, count = 10): Question[] {
  const items = shuffle(cat.items).slice(0, count);
  const allTranslations = cat.items.map((it) => it.translations[lang]);

  return items.map((item) => {
    const correct = item.translations[lang];
    const distractors = shuffle(allTranslations.filter((t) => t !== correct)).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    return { item, options, correctIndex: options.indexOf(correct) };
  });
}

const QUIZ_SIZE = 10;

const QuizGame = ({ lang }: QuizGameProps) => {
  const [state, setState] = useState<QuizState>("menu");
  const [selectedCat, setSelectedCat] = useState<Category>(CATEGORIES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const startQuiz = useCallback((cat: Category) => {
    setSelectedCat(cat);
    const qs = generateQuestions(cat, lang, QUIZ_SIZE);
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setAnswered(false);
    setState("playing");
  }, [lang]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === questions[currentQ].correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setState("result");
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const progress = questions.length > 0 ? ((currentQ + (answered ? 1 : 0)) / questions.length) * 100 : 0;
  const q = questions[currentQ];

  const stars = score >= questions.length ? 3 : score >= questions.length * 0.7 ? 2 : score >= questions.length * 0.4 ? 1 : 0;

  // ── MENU ──
  if (state === "menu") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-5xl mb-3 block">🎮</span>
          <h2 className="text-xl font-display font-bold text-foreground mb-1">Quiz {LANG_META[lang].name}</h2>
          <p className="text-sm text-muted-foreground">Choisis une catégorie et teste tes connaissances !</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => startQuiz(cat)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
              <span className="text-[11px] text-muted-foreground">{Math.min(cat.items.length, QUIZ_SIZE)} questions</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (state === "result") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
        <div>
          <span className="text-6xl mb-4 block">{stars >= 3 ? "🏆" : stars >= 2 ? "🌟" : stars >= 1 ? "👏" : "💪"}</span>
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">Quiz terminé !</h2>
          <p className="text-muted-foreground">{selectedCat.emoji} {selectedCat.label} — {LANG_META[lang].name}</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.2 }}>
              <Star className={`w-10 h-10 ${s <= stars ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`} />
            </motion.div>
          ))}
        </div>

        <div className="bg-card/80 border border-border rounded-2xl p-6 max-w-xs mx-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Score</span>
            <span className="font-bold text-foreground">{score}/{questions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meilleure série</span>
            <span className="font-bold text-foreground flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-500" /> {bestStreak}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Précision</span>
            <span className="font-bold text-foreground">{Math.round((score / questions.length) * 100)}%</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setState("menu")} className="gap-2 rounded-full">
            <RotateCcw className="w-4 h-4" /> Autre catégorie
          </Button>
          <Button onClick={() => startQuiz(selectedCat)} className="gap-2 rounded-full">
            <RotateCcw className="w-4 h-4" /> Rejouer
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── PLAYING ──
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Question {currentQ + 1}/{questions.length}</span>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                <Zap className="w-4 h-4" /> {streak}
              </motion.span>
            )}
            <span className="flex items-center gap-1 font-bold text-foreground">
              <Trophy className="w-4 h-4 text-primary" /> {score}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="bg-card/80 border border-border rounded-2xl p-8 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
            Comment dit-on en {LANG_META[lang].name} ?
          </p>
          <span className="text-6xl block mb-3">{q.item.emoji}</span>
          <p className="text-xl font-display font-bold text-foreground">{q.item.french}</p>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.options.map((opt, idx) => {
          const isCorrect = idx === q.correctIndex;
          const isSelected = idx === selected;
          let bg = "bg-card/60 border-border hover:border-primary/50 hover:bg-primary/5";
          if (answered) {
            if (isCorrect) bg = "bg-green-500/10 border-green-500/50 ring-1 ring-green-500/30";
            else if (isSelected) bg = "bg-red-500/10 border-red-500/50 ring-1 ring-red-500/30";
            else bg = "bg-card/40 border-border opacity-50";
          }
          return (
            <motion.button
              key={idx}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${bg}`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                answered && isCorrect ? "bg-green-500 text-white" :
                answered && isSelected ? "bg-red-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {answered && isCorrect ? <CheckCircle2 className="w-5 h-5" /> :
                 answered && isSelected ? <XCircle className="w-5 h-5" /> :
                 String.fromCharCode(65 + idx)}
              </span>
              <span className={`font-medium ${answered && isCorrect ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      {answered && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
          <Button onClick={nextQuestion} className="gap-2 rounded-full px-8">
            {currentQ + 1 >= questions.length ? "Voir le résultat" : "Suivant"} <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default QuizGame;
