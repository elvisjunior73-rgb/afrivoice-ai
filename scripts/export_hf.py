import os
import argparse
import json
from datasets import Dataset, Audio
from huggingface_hub import HfApi

def export_to_huggingface(jsonl_file, dataset_name, token=None):
    """
    Convertit les données nettoyées au format Hugging Face Dataset et les pousse vers le Hub.
    
    Args:
        jsonl_file (str): Chemin vers le fichier JSONL contenant les données nettoyées.
        dataset_name (str): Nom du dataset sur le Hugging Face Hub (ex: 'username/afrivoice-lin').
        token (str): Jeton d'accès Hugging Face (optionnel si déjà connecté via CLI).
    """
    print(f"Exportation des données depuis {jsonl_file} vers Hugging Face ({dataset_name})...")
    
    data = {"audio": [], "sentence": [], "language": []}
    
    with open(jsonl_file, 'r', encoding='utf-8') as f:
        for line in f:
            entry = json.loads(line)
            data["audio"].append(entry["audio_file"])
            data["sentence"].append(entry["text"])
            data["language"].append(entry["language"])
            
    # Création du dataset Hugging Face
    hf_dataset = Dataset.from_dict(data)
    
    # Cast de la colonne audio pour utiliser la fonctionnalité Audio de Hugging Face
    hf_dataset = hf_dataset.cast_column("audio", Audio(sampling_rate=16000))
    
    print(f"Dataset créé avec {len(hf_dataset)} exemples.")
    
    # Pousser vers le Hub
    try:
        hf_dataset.push_to_hub(dataset_name, token=token)
        print(f"Dataset poussé avec succès vers https://huggingface.co/datasets/{dataset_name}")
    except Exception as e:
        print(f"Erreur lors de la publication sur Hugging Face : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export vers Hugging Face pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Fichier JSONL contenant les données nettoyées.")
    parser.add_argument("--dataset", type=str, required=True, help="Nom du dataset sur le Hub (ex: 'username/afrivoice-lin').")
    parser.add_argument("--token", type=str, default=None, help="Jeton d'accès Hugging Face (optionnel).")
    
    args = parser.parse_args()
    
    export_to_huggingface(args.input, args.dataset, args.token)
