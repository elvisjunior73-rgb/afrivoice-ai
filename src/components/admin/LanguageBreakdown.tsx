import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

const LANGUES: Record<string, { nom: string; color: string; icon: string }> = {
  lin: { nom: "Lingala", color: "text-primary", icon: "🇨🇩" },
  kon: { nom: "Kikongo", color: "text-accent", icon: "🇦🇴" },
  sag: { nom: "Sango", color: "text-secondary", icon: "🇨🇫" },
};

interface LangStat {
  interactions: number;
  audioSeconds: number;
  corrections: number;
  collectionSeconds: number;
  collectionSegments: number;
}

interface LanguageBreakdownProps {
  langStats: Record<string, LangStat>;
}

const LanguageBreakdown = ({ langStats }: LanguageBreakdownProps) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-primary" /> Par langue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Object.entries(LANGUES).map(([code, meta]) => {
          const ls = langStats[code] || { interactions: 0, audioSeconds: 0, corrections: 0, collectionSeconds: 0, collectionSegments: 0 };
          const totalMinutes = (ls.audioSeconds + ls.collectionSeconds) / 60;
          return (
            <div key={code} className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <span className={`font-display font-semibold ${meta.color}`}>{meta.nom}</span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span>{ls.interactions} interactions</span>
                  <span>{totalMinutes.toFixed(1)} min total</span>
                  <Badge variant="outline" className="text-xs">{ls.corrections} corrections</Badge>
                  <Badge variant="secondary" className="text-xs">{ls.collectionSegments} segments collectés</Badge>
                </div>
              </div>
              <Progress value={Math.min((totalMinutes / 60) * 100, 100)} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  </motion.div>
);

export { LANGUES };
export type { LangStat };
export default LanguageBreakdown;
