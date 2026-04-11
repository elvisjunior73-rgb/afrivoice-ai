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
    const { interaction_id, corrected_text, language, user_id } = await req.json();

    if (!interaction_id || !corrected_text) {
      return new Response(
        JSON.stringify({ error: "interaction_id et corrected_text sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Mettre à jour l'interaction vocale avec le texte corrigé
    const { data: interaction, error: updateError } = await supabase
      .from("interactions_vocales")
      .update({
        corrected_text: corrected_text,
        is_corrected: true,
        corrected_at: new Date().toISOString(),
        corrected_by: user_id,
      })
      .eq("id", interaction_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    // 2. Ajouter au gold dataset (ensemble de données or)
    const { data: goldEntry, error: goldError } = await supabase
      .from("ensemble_de_donnees_or")
      .insert({
        interaction_id: interaction_id,
        audio_url: interaction.audio_url,
        asr_text: interaction.asr_text,
        corrected_text: corrected_text,
        language: language || interaction.language,
        confidence: interaction.confidence,
        user_id: user_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (goldError) {
      console.error("Erreur gold dataset:", goldError);
    }

    // 3. Mettre à jour les statistiques de collecte
    const { error: statsError } = await supabase.rpc("increment_collection_stats", {
      p_language: language || interaction.language,
      p_corrections: 1,
    });

    if (statsError) {
      console.error("Erreur stats:", statsError);
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
