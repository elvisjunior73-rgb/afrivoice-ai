import os
import argparse
import json
import hashlib
from pathlib import Path

def clean_and_deduplicate(transcriptions_dir, output_dir):
    """
    Nettoie les transcriptions et supprime les doublons.
    
    Args:
        transcriptions_dir (str): Répertoire contenant les fichiers JSON de transcription.
        output_dir (str): Répertoire de destination pour les données nettoyées.
    """
    print(f"Nettoyage et déduplication des transcriptions dans {transcriptions_dir}...")
    
    seen_hashes = set()
    cleaned_data = []
    
    for file in os.listdir(transcriptions_dir):
        if file.endswith('.json'):
            file_path = os.path.join(transcriptions_dir, file)
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            text = data.get("text", "").strip()
            
            # Filtrage basique : texte trop court ou vide
            if len(text) < 5:
                continue
                
            # Création d'un hash du texte pour la déduplication
            text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
            
            if text_hash not in seen_hashes:
                seen_hashes.add(text_hash)
                
                # Nettoyage basique du texte (ex: suppression des espaces multiples)
                cleaned_text = " ".join(text.split())
                
                cleaned_entry = {
                    "audio_file": data["audio_file"],
                    "text": cleaned_text,
                    "language": data.get("language", "unknown")
                }
                cleaned_data.append(cleaned_entry)
                
    # Sauvegarde des données nettoyées
    output_file = os.path.join(output_dir, "cleaned_dataset.jsonl")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in cleaned_data:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
            
    print(f"Nettoyage terminé. {len(cleaned_data)} entrées uniques sauvegardées dans {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nettoyage et déduplication pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Répertoire contenant les transcriptions JSON.")
    parser.add_argument("--output", type=str, default="../donnees/nettoyees", help="Répertoire de sortie pour les données nettoyées.")
    
    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    clean_and_deduplicate(args.input, args.output)
