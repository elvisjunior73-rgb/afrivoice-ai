const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RSS_FEEDS = [
  { name: "RFI Afrique", url: "https://www.rfi.fr/fr/afrique/rss" },
  { name: "France24 Afrique", url: "https://www.france24.com/fr/afrique/rss" },
  { name: "BBC Afrique", url: "https://feeds.bbci.co.uk/afrique/rss.xml" },
  { name: "Jeune Afrique", url: "https://www.jeuneafrique.com/feed/" },
];

function extractItems(xml: string, maxItems = 6): { title: string; description: string; link: string; source: string }[] {
  const items: { title: string; description: string; link: string; source: string }[] = [];
  
  // Extract channel title for source
  const channelTitleMatch = xml.match(/<channel>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]>|<channel>[\s\S]*?<title>(.*?)<\/title>/);
  const source = channelTitleMatch?.[1] || channelTitleMatch?.[2] || "Actualités";

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>|<title>([\s\S]*?)<\/title>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);

    const title = (titleMatch?.[1] || titleMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();
    const description = (descMatch?.[1] || descMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();
    const link = (linkMatch?.[1] || "").trim();

    if (title) items.push({ title, description: description.slice(0, 200), link, source });
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, mode } = await req.json();
    // mode: "headlines" = just fetch RSS and return, "radio" = fetch RSS + AI reads them aloud-style

    // Fetch RSS feeds in parallel
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const resp = await fetch(feed.url, {
            signal: controller.signal,
            headers: { "User-Agent": "AfriVoice-Bot/1.0" },
          });
          clearTimeout(timeout);
          if (!resp.ok) return [];
          const xml = await resp.text();
          return extractItems(xml, 3);
        } catch {
          clearTimeout(timeout);
          return [];
        }
      })
    );

    const allItems = feedResults
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .slice(0, 8);

    if (mode === "headlines") {
      return new Response(JSON.stringify({ items: allItems }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // mode === "radio" — AI presents news in target language
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquant");

    const langNames: Record<string, string> = { lin: "Lingala", kon: "Kikongo", sag: "Sango" };
    const langName = langNames[language] || "Lingala";

    const newsText = allItems.map((item, i) => `${i + 1}. ${item.title} — ${item.description}`).join("\n");

    const systemPrompt = `Tu es un présentateur radio AfriVoice. Tu lis les actualités du jour en ${langName}.

RÈGLES :
- Traduis et présente CHAQUE actualité en ${langName}
- Style radio : vivant, captivant, avec des transitions
- Commence par une salutation radio en ${langName}
- Termine par une phrase de clôture radio
- 3-5 phrases par actualité, pas plus
- Si tu ne connais pas un mot en ${langName}, utilise le français entre guillemets

Voici les actualités à présenter :
${newsText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Présente ces ${allItems.length} actualités en ${langName}, style radio.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA", items: allItems }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
