import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminHeader from "@/components/admin/AdminHeader";
import KpiCards from "@/components/admin/KpiCards";
import LanguageBreakdown from "@/components/admin/LanguageBreakdown";
import ActivityFeed from "@/components/admin/ActivityFeed";
import DataTables from "@/components/admin/DataTables";
import type { LangStat } from "@/components/admin/LanguageBreakdown";
import type { FeedItem } from "@/components/admin/ActivityFeed";
import type { Interaction, GoldEntry, CollectionEntry } from "@/components/admin/DataTables";

const AdminDashboard = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [goldEntries, setGoldEntries] = useState<GoldEntry[]>([]);
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    const [
      { data: voiceData },
      { data: convData },
      { data: goldData },
      { data: collData },
    ] = await Promise.all([
      supabase.from("voice_interactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("conversations").select("id"),
      supabase.from("gold_dataset").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("collection_stats").select("*").order("date", { ascending: false }).limit(100),
    ]);

    setInteractions((voiceData || []) as Interaction[]);
    setGoldEntries((goldData || []) as GoldEntry[]);
    setCollectionEntries((collData || []) as CollectionEntry[]);
    setTotalConversations((convData || []).length);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

  // Initial fetch + realtime subscriptions
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "voice_interactions" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "gold_dataset" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "collection_stats" }, () => fetchData())
      .subscribe((status) => {
        setIsRealtime(status === "SUBSCRIBED");
      });

    // Fallback polling every 60s
    const interval = setInterval(fetchData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Computed stats
  const langStats: Record<string, LangStat> = {
    lin: { interactions: 0, audioSeconds: 0, corrections: 0, collectionSeconds: 0, collectionSegments: 0 },
    kon: { interactions: 0, audioSeconds: 0, corrections: 0, collectionSeconds: 0, collectionSegments: 0 },
    sag: { interactions: 0, audioSeconds: 0, corrections: 0, collectionSeconds: 0, collectionSegments: 0 },
  };

  let totalAudioSeconds = 0;
  let correctedCount = 0;

  interactions.forEach((v) => {
    const dur = Number(v.audio_duration_seconds) || 0;
    totalAudioSeconds += dur;
    if (langStats[v.language]) {
      langStats[v.language].interactions += 1;
      langStats[v.language].audioSeconds += dur;
      if (v.is_corrected) langStats[v.language].corrections += 1;
    }
    if (v.is_corrected) correctedCount += 1;
  });

  let totalCollectionSeconds = 0;
  let totalCollectionSegments = 0;

  collectionEntries.forEach((c) => {
    totalCollectionSeconds += Number(c.total_seconds) || 0;
    totalCollectionSegments += Number(c.total_segments) || 0;
    if (langStats[c.language]) {
      langStats[c.language].collectionSeconds += Number(c.total_seconds) || 0;
      langStats[c.language].collectionSegments += Number(c.total_segments) || 0;
    }
  });

  const correctionRate = interactions.length > 0 ? (correctedCount / interactions.length) * 100 : 0;

  // Build activity feed from all sources
  const feedItems: FeedItem[] = [
    ...interactions.slice(0, 20).map((v) => ({
      id: `vi-${v.id}`,
      type: "interaction" as const,
      language: v.language,
      description: v.is_corrected
        ? `Correction : "${v.corrected_text?.slice(0, 50)}"`
        : `Interaction vocale${v.asr_text ? ` : "${v.asr_text.slice(0, 50)}"` : ""}`,
      timestamp: v.created_at,
    })),
    ...goldEntries.slice(0, 10).map((g) => ({
      id: `gd-${g.id}`,
      type: "gold" as const,
      language: g.language,
      description: `Gold ajouté : "${g.corrected_text.slice(0, 50)}"`,
      timestamp: g.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        lastRefresh={lastRefresh}
        isRefreshing={isRefreshing}
        isRealtime={isRealtime}
        onRefresh={fetchData}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <KpiCards
          totalHours={totalAudioSeconds / 3600}
          totalInteractions={interactions.length}
          totalConversations={totalConversations}
          totalGoldEntries={goldEntries.length}
          correctionRate={correctionRate}
          totalCollectionSeconds={totalCollectionSeconds}
          totalCollectionSegments={totalCollectionSegments}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LanguageBreakdown langStats={langStats} />
          </div>
          <div>
            <ActivityFeed items={feedItems} />
          </div>
        </div>

        <DataTables
          interactions={interactions}
          goldEntries={goldEntries}
          collectionEntries={collectionEntries}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
