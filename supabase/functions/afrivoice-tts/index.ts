import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Texte manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const BACKEND_URL = Deno.env.get("AFRIVOICE_BACKEND_URL");

    // Choisir la voix selon la langue
    // Voix OpenAI TTS : alloy, echo, fable, onyx, nova, shimmer
    // Pour les langues africaines, "alloy" ou "nova" donnent les meilleurs résultats
    const voice = language === "lin" ? "alloy" : language === "sag" ? "nova" : "echo";

    if (BACKEND_URL) {
      // Utiliser le backend FastAPI si disponible
      const formData = new FormData();
      formData.append("text", text);
      formData.append("language", language || "lin");

      const response = await fetch(`${BACKEND_URL}/tts`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/wav",
          },
        });
      }
    }

    if (OPENAI_API_KEY) {
      // Utiliser l'API TTS d'OpenAI
      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice,
          response_format: "mp3",
        }),
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
          },
        });
      }
    }

    // Fallback : retourner une URL d'audio vide
    return new Response(
      JSON.stringify({
        error: "TTS non configuré. Configurez OPENAI_API_KEY ou AFRIVOICE_BACKEND_URL.",
        text_fallback: text,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("TTS error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
