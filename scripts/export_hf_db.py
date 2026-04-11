import os
import json
import argparse
from supabase import create_client, Client
from huggingface_hub import HfApi
from datasets import Dataset

def export_gold_dataset(supabase_url: str, supabase_key: str, hf_token: str):
    """
    Exporte les données corrigées (gold dataset) depuis Supabase vers Hugging Face.
    """
    print("Connexion à Supabase...")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("Récupération des données corrigées (ensemble de données or)...")
    # On suppose que la table s'appelle 'ensemble_de_donnees_or' ou 'gold_dataset'
    # Ajuster le nom de la table selon le schéma exact
    response = supabase.table("ensemble_de_donnees_or").select("*").execute()
    data = response.data
    
    if not data:
        print("Aucune donnée à exporter.")
        return
        
    print(f"{len(data)} enregistrements trouvés.")
    
    # Séparer par langue
    datasets_by_lang = {
        "lin": [],
        "kon": [],
        "sag": []
    }
    
    for row in data:
        lang = row.get("language", "lin")
        if lang in datasets_by_lang:
            datasets_by_lang[lang].append({
                "audio_url": row.get("audio_url", ""),
                "text": row.get("corrected_text", ""),
                "original_asr": row.get("asr_text", ""),
                "user_id": row.get("user_id", ""),
                "timestamp": row.get("created_at", "")
            })
            
    print("Connexion à Hugging Face...")
    api = HfApi(token=hf_token)
    
    for lang, records in datasets_by_lang.items():
        if not records:
            continue
            
        print(f"Export de {len(records)} enregistrements pour la langue {lang}...")
        
        # Créer un dataset Hugging Face
        hf_dataset = Dataset.from_list(records)
        
        # Nom du repo sur HF
        repo_id = f"MANIANGA/afrivoice-{lang}-gold"
        
        try:
            # Créer le repo s'il n'existe pas
            api.create_repo(repo_id=repo_id, repo_type="dataset", exist_ok=True)
            
            # Pousser les données
            hf_dataset.push_to_hub(repo_id, token=hf_token)
            print(f"✅ Export réussi vers {repo_id}")
        except Exception as e:
            print(f"❌ Erreur lors de l'export vers {repo_id}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Gold Dataset to Hugging Face")
    parser.add_argument("--supabase-url", required=True, help="Supabase URL")
    parser.add_argument("--supabase-key", required=True, help="Supabase Service Role Key")
    parser.add_argument("--hf-token", required=True, help="Hugging Face Token")
    
    args = parser.parse_args()
    export_gold_dataset(args.supabase_url, args.supabase_key, args.hf_token)
