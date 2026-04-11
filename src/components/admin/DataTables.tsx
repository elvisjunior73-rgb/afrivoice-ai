import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileAudio, Star, Database } from "lucide-react";
import { LANGUES } from "./LanguageBreakdown";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

interface CollectionEntry {
  id: string;
  language: string;
  source: string;
  total_seconds: number;
  total_segments: number;
  total_corrections: number;
  date: string;
}

interface DataTablesProps {
  interactions: Interaction[];
  goldEntries: GoldEntry[];
  collectionEntries: CollectionEntry[];
}

const DataTables = ({ interactions, goldEntries, collectionEntries }: DataTablesProps) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
    <Tabs defaultValue="interactions">
      <TabsList className="mb-4">
        <TabsTrigger value="interactions" className="gap-2">
          <FileAudio className="w-4 h-4" /> Interactions
        </TabsTrigger>
        <TabsTrigger value="gold" className="gap-2">
          <Star className="w-4 h-4" /> Gold Dataset
        </TabsTrigger>
        <TabsTrigger value="collection" className="gap-2">
          <Database className="w-4 h-4" /> Collecte
        </TabsTrigger>
      </TabsList>

      <TabsContent value="interactions">
        <Card>
          <CardContent className="pt-4 px-0">
            {interactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune interaction encore.</p>
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
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(v.created_at)}</TableCell>
                        <TableCell><span className={meta?.color}>{meta?.icon} {meta?.nom}</span></TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{v.asr_text || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {v.is_corrected ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{v.corrected_text}</Badge>
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
              <p className="text-center py-8 text-muted-foreground">Aucune correction validée encore.</p>
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
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(g.created_at)}</TableCell>
                        <TableCell><span className={meta?.color}>{meta?.icon} {meta?.nom}</span></TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground line-through">{g.original_text}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs font-medium text-primary">{g.corrected_text}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="collection">
        <Card>
          <CardContent className="pt-4 px-0">
            {collectionEntries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune donnée de collecte encore.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Corrections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionEntries.map((c) => {
                    const meta = LANGUES[c.language];
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.date}</TableCell>
                        <TableCell><span className={meta?.color}>{meta?.icon} {meta?.nom}</span></TableCell>
                        <TableCell className="text-xs">{c.source}</TableCell>
                        <TableCell className="text-xs font-medium">{c.total_segments}</TableCell>
                        <TableCell className="text-xs">{(c.total_seconds / 60).toFixed(1)} min</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.total_corrections}</Badge></TableCell>
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
);

export type { Interaction, GoldEntry, CollectionEntry };
export default DataTables;
