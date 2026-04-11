import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { interaction_id, corrected_text, language } = await req.json();

    if (!interaction_id || !corrected_text) {
      return new Response(
        JSON.stringify({ error: "interaction_id et corrected_text sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Update voice_interactions with corrected text
    const { data: interaction, error: updateError } = await supabase
      .from("voice_interactions")
      .update({
        corrected_text: corrected_text,
        is_corrected: true,
        is_validated: true,
      })
      .eq("id", interaction_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    // 2. Add to gold_dataset
    const { data: goldEntry, error: goldError } = await supabase  
      .from("gold_dataset")
      .insert({
        interaction_id: interaction_id,
        original_text: interaction.asr_text || "",
        corrected_text: corrected_text,
        language: language || interaction.language,
        audio_duration_seconds: interaction.audio_duration_seconds,
      })
      .select()
      .single();

    if (goldError) {
      console.error("Erreur gold dataset:", goldError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Correction enregistrée et ajoutée au gold dataset",
        gold_id: goldEntry?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("Correction error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
