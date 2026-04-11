import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Mic, Activity, Star, TrendingUp, Users, MessageSquare } from "lucide-react";

interface KpiCardsProps {
  totalHours: number;
  totalInteractions: number;
  totalConversations: number;
  totalGoldEntries: number;
  correctionRate: number;
  totalCollectionSeconds: number;
  totalCollectionSegments: number;
}

const KpiCards = ({
  totalHours, totalInteractions, totalConversations,
  totalGoldEntries, correctionRate, totalCollectionSeconds, totalCollectionSegments,
}: KpiCardsProps) => {
  const collectionHours = totalCollectionSeconds / 3600;

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Audio collecté</span>
          </div>
          <div className="font-display text-2xl font-bold text-primary">
            {collectionHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">{totalCollectionSegments} segments</p>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Heures chat vocal</span>
          </div>
          <div className="font-display text-2xl font-bold text-accent">
            {totalHours.toFixed(2)}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">{totalInteractions} interactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Conversations</span>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">
            {totalConversations}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Gold Dataset</span>
          </div>
          <div className="font-display text-2xl font-bold text-primary">
            {totalGoldEntries}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 md:col-span-1">
        <CardContent className="pt-5 pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Taux correction</span>
          </div>
          <div className="font-display text-2xl font-bold text-foreground">
            {correctionRate.toFixed(0)}%
          </div>
          <Progress value={correctionRate} className="mt-2 h-2" />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KpiCards;
