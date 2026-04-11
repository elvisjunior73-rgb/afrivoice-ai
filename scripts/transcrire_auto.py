import os
import argparse
import whisper
import json
from pathlib import Path

def transcribe_audio(audio_file, output_dir, model_size="large-v3"):
    """
    Transcrit automatiquement un segment audio en utilisant Whisper.
    
    Args:
        audio_file (str): Chemin vers le fichier audio.
        output_dir (str): Répertoire de destination pour les transcriptions.
        model_size (str): Taille du modèle Whisper à utiliser.
    """
    print(f"Transcription de {audio_file} avec le modèle {model_size}...")
    
    # Chargement du modèle Whisper
    model = whisper.load_model(model_size)
    
    # Transcription
    result = model.transcribe(audio_file)
    
    # Sauvegarde du résultat au format JSON
    base_name = Path(audio_file).stem
    output_file = os.path.join(output_dir, f"{base_name}.json")
    
    data = {
        "audio_file": audio_file,
        "text": result["text"],
        "segments": result["segments"],
        "language": result["language"]
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print(f"Transcription sauvegardée dans {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcription automatique pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Fichier audio d'entrée ou répertoire.")
    parser.add_argument("--output", type=str, default="../donnees/transcriptions", help="Répertoire de sortie pour les transcriptions.")
    parser.add_argument("--model", type=str, default="large-v3", help="Taille du modèle Whisper (ex: large-v3).")
    
    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    if os.path.isdir(args.input):
        for file in os.listdir(args.input):
            if file.endswith('.wav'):
                transcribe_audio(os.path.join(args.input, file), args.output, args.model)
    else:
        transcribe_audio(args.input, args.output, args.model)
