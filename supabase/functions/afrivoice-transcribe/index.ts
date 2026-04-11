import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language") as string || "lin";
    const conversationId = formData.get("conversation_id") as string;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Fichier audio manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Appel à l'API OpenAI Whisper (compatible avec le backend RunPod)
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const BACKEND_URL = Deno.env.get("AFRIVOICE_BACKEND_URL");

    let transcription = "";
    let confidence = 0.0;

    if (BACKEND_URL) {
      // Utiliser le backend FastAPI (RunPod) si disponible
      const backendFormData = new FormData();
      backendFormData.append("audio", audioFile);
      backendFormData.append("language", language);

      const backendResponse = await fetch(`${BACKEND_URL}/transcribe`, {
        method: "POST",
        body: backendFormData,
      });

      if (backendResponse.ok) {
        const result = await backendResponse.json();
        transcription = result.text;
        confidence = result.language_probability || 0.9;
      }
    } else if (OPENAI_API_KEY) {
      // Fallback : utiliser l'API OpenAI Whisper
      const whisperFormData = new FormData();
      whisperFormData.append("file", audioFile, "audio.wav");
      whisperFormData.append("model", "whisper-1");
      whisperFormData.append("language", language === "lin" ? "fr" : language === "sag" ? "fr" : "fr");

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      });

      if (whisperResponse.ok) {
        const result = await whisperResponse.json();
        transcription = result.text;
        confidence = 0.85; // Estimation pour Whisper standard
      }
    } else {
      // Placeholder si aucun backend n'est configuré
      transcription = "[Audio transcrit - configurez OPENAI_API_KEY ou AFRIVOICE_BACKEND_URL]";
      confidence = 0.0;
    }

    // Sauvegarder dans Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sauvegarder l'audio dans R2 via le bucket Supabase Storage
    const audioBuffer = await audioFile.arrayBuffer();
    const audioPath = `audio/${conversationId || crypto.randomUUID()}/${Date.now()}.wav`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from("afrivoice-audio")
      .upload(audioPath, audioBuffer, { contentType: "audio/wav" });

    const audioUrl = storageError ? null : supabase.storage
      .from("afrivoice-audio")
      .getPublicUrl(audioPath).data.publicUrl;

    // Sauvegarder dans la table interactions_vocales
    const { data: interaction, error: dbError } = await supabase
      .from("interactions_vocales")
      .insert({
        conversation_id: conversationId,
        audio_url: audioUrl,
        asr_text: transcription,
        language: language,
        confidence: confidence,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
    }

    return new Response(
      JSON.stringify({
        text: transcription,
        confidence: confidence,
        interaction_id: interaction?.id,
        audio_url: audioUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("Transcription error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
