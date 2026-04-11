import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  lastRefresh: Date;
  isRefreshing: boolean;
  isRealtime: boolean;
  onRefresh: () => void;
}

const AdminHeader = ({ lastRefresh, isRefreshing, isRealtime, onRefresh }: AdminHeaderProps) => (
  <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">
            AfriVoice AI <span className="text-primary">— Admin</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Suivi temps réel — Collecte & Contributions
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          MAJ : {lastRefresh.toLocaleTimeString("fr-FR")}
        </span>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isRealtime ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
          <span className={`text-xs font-medium ${isRealtime ? "text-green-500" : "text-yellow-500"}`}>
            {isRealtime ? "Temps réel" : "Polling"}
          </span>
        </div>
      </div>
    </div>
  </header>
);

export default AdminHeader;
