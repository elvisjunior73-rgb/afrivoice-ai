import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Mic, Star, MessageSquare } from "lucide-react";

interface FeedItem {
  id: string;
  type: "interaction" | "conversation" | "gold" | "collection";
  language: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: FeedItem[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

const ICONS = {
  interaction: Mic,
  conversation: MessageSquare,
  gold: Star,
  collection: Activity,
};

const COLORS = {
  interaction: "text-accent",
  conversation: "text-secondary",
  gold: "text-primary",
  collection: "text-primary",
};

const ActivityFeed = ({ items }: ActivityFeedProps) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" /> Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">Aucune activité encore.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, i) => {
              const Icon = ICONS[item.type];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`mt-0.5 ${COLORS[item.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.language}</Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export type { FeedItem };
export default ActivityFeed;
