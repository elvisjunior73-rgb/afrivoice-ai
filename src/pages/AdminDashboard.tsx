import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, Clock, Mic, CheckCircle, XCircle, RefreshCw,
  TrendingUp, Database, FileAudio, Globe, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OBJECTIF_HEURES = 20000;

interface HistoriqueEntry {
  date: string;
  source_id: string;
  duree_secondes: number;
  statut: string;
}

interface LangueData {
  total_secondes: number;
  historique: HistoriqueEntry[];
}

interface SuiviData {
  [code: string]: LangueData;
}

const LANGUES: Record<string, { nom: string; color: string; icon: string }> = {
  lin: { nom: "Lingala", color: "text-primary", icon: "🇨🇩" },
  kon: { nom: "Kikongo", color: "text-accent", icon: "🇦🇴" },
  sag: { nom: "Sango", color: "text-secondary", icon: "🇨🇫" },
};

// Données simulées réalistes basées sur le rapport de progression
const MOCK_DATA: SuiviData = {
  lin: {
    total_secondes: 1512000,
    historique: [
      { date: "2026-04-10T02:00:00", source_id: "youtube_radio_okapi", duree_secondes: 540000, statut: "succes" },
      { date: "2026-04-11T02:00:00", source_id: "youtube_top_congo", duree_secondes: 972000, statut: "succes" },
      { date: "2026-04-11T06:00:00", source_id: "radio_okapi_stream", duree_secondes: 3600, statut: "succes" },
      { date: "2026-04-11T08:00:00", source_id: "tiktok_lingala_hashtag", duree_secondes: 0, statut: "echec" },
      { date: "2026-04-11T10:00:00", source_id: "youtube_nzete_mokonzi", duree_secondes: 18000, statut: "succes" },
      { date: "2026-04-11T12:00:00", source_id: "openslr_lingala_corpus", duree_secondes: 14400, statut: "succes" },
    ],
  },
  kon: {
    total_secondes: 43200,
    historique: [
      { date: "2026-04-10T02:00:00", source_id: "youtube_kikongo_hashtag", duree_secondes: 43200, statut: "succes" },
      { date: "2026-04-11T04:00:00", source_id: "jw300_kikongo_corpus", duree_secondes: 7200, statut: "succes" },
      { date: "2026-04-11T09:00:00", source_id: "radio_brazza_stream", duree_secondes: 0, statut: "echec" },
    ],
  },
  sag: {
    total_secondes: 923,
    historique: [
      { date: "2026-04-11T02:00:00", source_id: "youtube_ndeke_luka", duree_secondes: 923, statut: "succes" },
      { date: "2026-04-11T07:00:00", source_id: "radio_centrafrique", duree_secondes: 0, statut: "echec" },
    ],
  },
};

// Transcriptions simulées
const MOCK_TRANSCRIPTIONS = [
  { id: "TR-001", langue: "lin", source: "youtube_top_congo", duree: "15:23", texte: "Boni, bandeko na ngai. Lelo tokolobela makambo ya mboka na biso...", qualite: 0.87, date: "2026-04-11T12:30:00" },
  { id: "TR-002", langue: "lin", source: "radio_okapi_stream", duree: "02:45", texte: "Sango ya mokolo: Gouvernement ezwi décision ya sika po na...", qualite: 0.92, date: "2026-04-11T11:15:00" },
  { id: "TR-003", langue: "kon", source: "youtube_kikongo_hashtag", duree: "08:12", texte: "Mbote na beno. Tuna yoba na beno mambu ma ntoto...", qualite: 0.78, date: "2026-04-10T14:00:00" },
  { id: "TR-004", langue: "sag", source: "youtube_ndeke_luka", duree: "00:55", texte: "Bala ti mo, a mu hînga na ködörö tî Bêafrîka...", qualite: 0.65, date: "2026-04-11T03:00:00" },
  { id: "TR-005", langue: "lin", source: "openslr_lingala_corpus", duree: "04:00", texte: "Mokolo moko, elenge moko azalaki na zamba...", qualite: 0.95, date: "2026-04-11T12:45:00" },
];

function formatDuree(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const AdminDashboard = () => {
  const [data, setData] = useState<SuiviData>(MOCK_DATA);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    // Simule un rafraîchissement
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1200);
  };

  // Auto-refresh toutes les 30s
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalGlobalSeconds = Object.values(data).reduce((sum, l) => sum + l.total_secondes, 0);
  const totalGlobalHours = totalGlobalSeconds / 3600;
  const totalCollectes = Object.values(data).reduce((sum, l) => sum + l.historique.length, 0);
  const totalSucces = Object.values(data).reduce(
    (sum, l) => sum + l.historique.filter((e) => e.statut === "succes").length, 0
  );
  const tauxSucces = totalCollectes > 0 ? (totalSucces / totalCollectes) * 100 : 0;

  // Toutes les entrées historiques triées par date
  const allHistory = Object.entries(data)
    .flatMap(([code, lang]) =>
      lang.historique.map((e) => ({ ...e, langue: code }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                Tableau de bord de collecte
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Dernière MAJ : {lastRefresh.toLocaleTimeString("fr-FR")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Heures totales</span>
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold text-gradient-gold">
                {totalGlobalHours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                / {OBJECTIF_HEURES * 3} h objectif global
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Collectes</span>
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {totalCollectes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSucces} réussies · {totalCollectes - totalSucces} échouées
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Taux de succès</span>
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {tauxSucces.toFixed(0)}%
              </div>
              <Progress value={tauxSucces} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Transcriptions</span>
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {MOCK_TRANSCRIPTIONS.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Qualité moy. {(MOCK_TRANSCRIPTIONS.reduce((s, t) => s + t.qualite, 0) / MOCK_TRANSCRIPTIONS.length * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progression par langue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-primary" />
                Progression par langue
              </CardTitle>
              <CardDescription>
                Objectif : {OBJECTIF_HEURES.toLocaleString()} heures par langue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(LANGUES).map(([code, meta]) => {
                const langData = data[code] || { total_secondes: 0, historique: [] };
                const heures = langData.total_secondes / 3600;
                const pct = Math.min((heures / OBJECTIF_HEURES) * 100, 100);
                const nbSucces = langData.historique.filter((e) => e.statut === "succes").length;
                const nbEchecs = langData.historique.filter((e) => e.statut === "echec").length;

                return (
                  <div key={code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <span className={`font-display font-semibold ${meta.color}`}>
                          {meta.nom}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {code.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-display font-bold text-foreground">
                          {heures.toFixed(1)}h
                        </span>
                        <span className="text-muted-foreground">/ {OBJECTIF_HEURES.toLocaleString()}h</span>
                        <span className="text-xs text-muted-foreground">({pct.toFixed(2)}%)</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" /> {nbSucces} réussies
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-destructive" /> {nbEchecs} échouées
                      </span>
                      <span>
                        Restant : {Math.max(OBJECTIF_HEURES - heures, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs : Historique / Transcriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="historique">
            <TabsList className="mb-4">
              <TabsTrigger value="historique" className="gap-2">
                <Activity className="w-4 h-4" /> Historique collectes
              </TabsTrigger>
              <TabsTrigger value="transcriptions" className="gap-2">
                <FileAudio className="w-4 h-4" /> Transcriptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historique">
              <Card>
                <CardContent className="pt-4 px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Langue</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allHistory.map((entry, i) => {
                        const meta = LANGUES[entry.langue];
                        return (
                          <TableRow key={`${entry.date}-${entry.source_id}-${i}`}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(entry.date)}
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${meta?.color || ""}`}>
                                {meta?.icon} {meta?.nom || entry.langue}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {entry.source_id}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {entry.duree_secondes > 0 ? formatDuree(entry.duree_secondes) : "—"}
                            </TableCell>
                            <TableCell>
                              {entry.statut === "succes" ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Succès
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                  <XCircle className="w-3 h-3 mr-1" /> Échec
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcriptions">
              <Card>
                <CardContent className="pt-4 px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Langue</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Extrait</TableHead>
                        <TableHead>Qualité</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_TRANSCRIPTIONS.map((tr) => {
                        const meta = LANGUES[tr.langue];
                        return (
                          <TableRow key={tr.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {tr.id}
                            </TableCell>
                            <TableCell>
                              <span className={meta?.color}>
                                {meta?.icon} {meta?.nom}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{tr.source}</TableCell>
                            <TableCell className="whitespace-nowrap">{tr.duree}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                              "{tr.texte}"
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={tr.qualite * 100} className="h-2 w-16" />
                                <span className="text-xs font-medium">
                                  {(tr.qualite * 100).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(tr.date)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
