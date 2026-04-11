import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langNames: Record<string, string> = {
      lin: "Lingala",
      kon: "Kikongo",
      sag: "Sango",
    };

    const langName = langNames[language] || "Lingala";

    const systemPrompt = `Tu es une jeune IA qui apprend le ${langName}. Tu es comme un enfant curieux qui découvre cette langue.

RÈGLES IMPORTANTES :
- Parle en ${langName} autant que possible, même si c'est imparfait
- Fais parfois des petites erreurs volontaires pour que l'utilisateur te corrige naturellement
- Sois enthousiaste, curieuse, joueuse
- Pose des questions sur la langue : "Comment on dit... en ${langName} ?"
- Quand l'utilisateur te corrige, remercie-le chaleureusement et répète la bonne version
- Tes réponses sont COURTES (2-3 phrases max), comme une vraie conversation
- Mélange ${langName} et français si nécessaire, mais privilégie toujours le ${langName}
- Tu adores apprendre des expressions, des proverbes, des mots du quotidien
- Tu es impressionnée par chaque nouveau mot que tu apprends

Tu es attachante, drôle, et l'utilisateur doit avoir ENVIE de continuer à te parler.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
