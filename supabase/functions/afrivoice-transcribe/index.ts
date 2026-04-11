import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language") as string || "lin";
    const sessionId = formData.get("session_id") as string || crypto.randomUUID();

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Fichier audio manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transcription via backend, Whisper, ou Lovable AI
    const BACKEND_URL = Deno.env.get("AFRIVOICE_BACKEND_URL");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let transcription = "";
    let confidence = 0.0;

    if (BACKEND_URL) {
      // Backend FastAPI custom
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
      // OpenAI Whisper
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
    } else if (LOVABLE_API_KEY) {
      // Fallback: use Lovable AI to acknowledge we received audio
      // (Real ASR needs Whisper or custom backend — this is a graceful fallback)
      const audioBytes = await audioFile.arrayBuffer();
      const durationEstimate = Math.round(audioBytes.byteLength / 16000); // rough estimate
      transcription = `[Audio reçu ~${durationEstimate}s — en attente d'un moteur ASR]`;
      confidence = 0.1;
    } else {
      transcription = "[Audio reçu — configurez un moteur de transcription]";
      confidence = 0.0;
    }

    // Save to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload audio to voice-recordings bucket
    const audioBuffer = await audioFile.arrayBuffer();
    const audioPath = `${sessionId}/${Date.now()}.webm`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from("voice-recordings")
      .upload(audioPath, audioBuffer, { contentType: audioFile.type || "audio/webm" });

    const audioUrl = storageError ? null : supabase.storage
      .from("voice-recordings")
      .getPublicUrl(audioPath).data.publicUrl;

    if (storageError) {
      console.error("Storage error:", storageError);
    }

    // Save to voice_interactions table
    const { data: interaction, error: dbError } = await supabase
      .from("voice_interactions")
      .insert({
        session_id: sessionId,
        asr_text: transcription,
        language: language,
        confidence_score: confidence,
        audio_duration_seconds: null,
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
        interactionId: interaction?.id,
        audioUrl: audioUrl,
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
