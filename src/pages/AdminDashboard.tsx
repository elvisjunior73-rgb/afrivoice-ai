import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, Clock, Mic, CheckCircle, XCircle, RefreshCw,
  TrendingUp, Database, FileAudio, Globe, BarChart3, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const OBJECTIF_HEURES = 20000;

const LANGUES: Record<string, { nom: string; color: string; icon: string }> = {
  lin: { nom: "Lingala", color: "text-primary", icon: "🇨🇩" },
  kon: { nom: "Kikongo", color: "text-accent", icon: "🇦🇴" },
  sag: { nom: "Sango", color: "text-secondary", icon: "🇨🇫" },
};

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

interface DBStats {
  totalInteractions: number;
  totalConversations: number;
  totalGoldEntries: number;
  totalAudioSeconds: number;
  correctionRate: number;
  langStats: Record<string, { interactions: number; audioSeconds: number; corrections: number }>;
}

interface Interaction {
  id: string;
  language: string;
  asr_text: string | null;
  corrected_text: string | null;
  confidence_score: number | null;
  is_corrected: boolean;
  audio_duration_seconds: number | null;
  created_at: string;
}

interface GoldEntry {
  id: string;
  original_text: string;
  corrected_text: string;
  language: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DBStats>({
    totalInteractions: 0, totalConversations: 0, totalGoldEntries: 0,
    totalAudioSeconds: 0, correctionRate: 0,
    langStats: { lin: { interactions: 0, audioSeconds: 0, corrections: 0 }, kon: { interactions: 0, audioSeconds: 0, corrections: 0 }, sag: { interactions: 0, audioSeconds: 0, corrections: 0 } },
  });
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [goldEntries, setGoldEntries] = useState<GoldEntry[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);

    const [
      { data: voiceData },
      { data: convData },
      { data: goldData },
    ] = await Promise.all([
      supabase.from("voice_interactions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("conversations").select("id"),
      supabase.from("gold_dataset").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const vi = voiceData || [];
    const gd = goldData || [];

    // Compute stats
    const langStats: DBStats["langStats"] = {
      lin: { interactions: 0, audioSeconds: 0, corrections: 0 },
      kon: { interactions: 0, audioSeconds: 0, corrections: 0 },
      sag: { interactions: 0, audioSeconds: 0, corrections: 0 },
    };

    let totalAudioSeconds = 0;
    let correctedCount = 0;

    vi.forEach((v) => {
      const lang = v.language as string;
      const dur = Number(v.audio_duration_seconds) || 0;
      totalAudioSeconds += dur;
      if (langStats[lang]) {
        langStats[lang].interactions += 1;
        langStats[lang].audioSeconds += dur;
        if (v.is_corrected) langStats[lang].corrections += 1;
      }
      if (v.is_corrected) correctedCount += 1;
    });

    setStats({
      totalInteractions: vi.length,
      totalConversations: (convData || []).length,
      totalGoldEntries: gd.length,
      totalAudioSeconds,
      correctionRate: vi.length > 0 ? (correctedCount / vi.length) * 100 : 0,
      langStats,
    });

    setInteractions(vi as Interaction[]);
    setGoldEntries(gd as GoldEntry[]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalHours = stats.totalAudioSeconds / 3600;

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
                Dashboard temps réel — Données live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              MAJ : {lastRefresh.toLocaleTimeString("fr-FR")}
            </span>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-medium">Live DB</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Heures audio</span>
              </div>
              <div className="font-display text-2xl font-bold text-gradient-gold">
                {totalHours.toFixed(2)}h
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Interactions</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {stats.totalInteractions}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Conversations</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {stats.totalConversations}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Gold Dataset</span>
              </div>
              <div className="font-display text-2xl font-bold text-gradient-gold">
                {stats.totalGoldEntries}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Taux correction</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {stats.correctionRate.toFixed(0)}%
              </div>
              <Progress value={stats.correctionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Per language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-primary" /> Par langue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(LANGUES).map(([code, meta]) => {
                const ls = stats.langStats[code] || { interactions: 0, audioSeconds: 0, corrections: 0 };
                return (
                  <div key={code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <span className={`font-display font-semibold ${meta.color}`}>{meta.nom}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{ls.interactions} interactions</span>
                        <span>{(ls.audioSeconds / 60).toFixed(1)} min</span>
                        <Badge variant="outline">{ls.corrections} corrections</Badge>
                      </div>
                    </div>
                    <Progress value={ls.interactions > 0 ? Math.min((ls.audioSeconds / 3600 / OBJECTIF_HEURES) * 100, 100) : 0} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="interactions">
            <TabsList className="mb-4">
              <TabsTrigger value="interactions" className="gap-2">
                <FileAudio className="w-4 h-4" /> Interactions récentes
              </TabsTrigger>
              <TabsTrigger value="gold" className="gap-2">
                <Star className="w-4 h-4" /> Gold Dataset
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interactions">
              <Card>
                <CardContent className="pt-4 px-0">
                  {interactions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Aucune interaction encore. Utilise le chat vocal pour commencer !
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Langue</TableHead>
                          <TableHead>ASR</TableHead>
                          <TableHead>Correction</TableHead>
                          <TableHead>Confiance</TableHead>
                          <TableHead>Durée</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interactions.map((v) => {
                          const meta = LANGUES[v.language];
                          return (
                            <TableRow key={v.id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(v.created_at)}
                              </TableCell>
                              <TableCell>
                                <span className={meta?.color}>{meta?.icon} {meta?.nom}</span>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs">
                                {v.asr_text || "—"}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs">
                                {v.is_corrected ? (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                    {v.corrected_text}
                                  </Badge>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                {v.confidence_score != null ? (
                                  <div className="flex items-center gap-2">
                                    <Progress value={Number(v.confidence_score) * 100} className="h-2 w-12" />
                                    <span className="text-xs">{(Number(v.confidence_score) * 100).toFixed(0)}%</span>
                                  </div>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {v.audio_duration_seconds ? `${Number(v.audio_duration_seconds).toFixed(1)}s` : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gold">
              <Card>
                <CardContent className="pt-4 px-0">
                  {goldEntries.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Aucune correction validée encore. Le Gold Dataset se remplit quand les utilisateurs corrigent les transcriptions.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Langue</TableHead>
                          <TableHead>Texte original</TableHead>
                          <TableHead>→ Correction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {goldEntries.map((g) => {
                          const meta = LANGUES[g.language];
                          return (
                            <TableRow key={g.id}>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(g.created_at)}
                              </TableCell>
                              <TableCell>
                                <span className={meta?.color}>{meta?.icon} {meta?.nom}</span>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground line-through">
                                {g.original_text}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs font-medium text-primary">
                                {g.corrected_text}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
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
