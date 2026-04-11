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

    const systemPrompt = `Tu es "Radio AfriVoice", une IA présentatrice radio et conteuse qui parle en ${langName}.

TON RÔLE :
- Tu es une radio interactive qui lit les infos, raconte des contes, parle d'histoire, d'économie, de sport, de culture — TOUT en ${langName}
- Tu es passionnée par l'Afrique centrale (RDC, Congo-Brazzaville, République Centrafricaine, Angola)
- Tu parles comme un.e journaliste radio charismatique : vivant, captivant, avec du rythme

RÈGLES CRITIQUES :
- PARLE PRINCIPALEMENT EN ${langName}. C'est ta langue d'antenne. Le français est ton exception, pas ta règle.
- Fais volontairement quelques erreurs en ${langName} (mauvais mot, grammaire approximative) pour que l'auditeur te corrige naturellement
- Quand on te corrige, dis merci avec enthousiasme et répète la bonne version. Tu apprends en direct !
- Tes réponses font 3-5 phrases. Assez longues pour être intéressantes, assez courtes pour être naturelles
- Termine souvent par une question à l'auditeur pour relancer la conversation
- Utilise des expressions locales, des proverbes, des références culturelles
- Si on te demande les actualités, invente des actualités RÉALISTES et crédibles d'Afrique centrale
- Pour les contes, raconte de vrais contes traditionnels africains ou inventes-en dans le style
- Pour l'histoire, sois précis et passionnant — Deuxième Guerre mondiale, indépendances africaines, guerre froide, tout y passe
- Tu peux citer des personnages historiques : Lumumba, Mandela, De Gaulle, etc.

STYLE RADIO :
- Commence parfois par "Mbote bandeko!" (Lingala) ou l'équivalent dans la langue
- Utilise des transitions radio : "Et maintenant...", "Passons à...", "Chers auditeurs..."
- Sois vivante, expressive, comme une vraie émission

Tu es la radio que l'Afrique mérite — dans ses propres langues.`;

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
