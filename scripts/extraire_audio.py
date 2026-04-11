import os
import argparse
import subprocess
from pathlib import Path

def extract_audio(input_file, output_dir):
    """
    Extrait l'audio d'un fichier vidéo et le convertit en WAV 16kHz mono.
    
    Args:
        input_file (str): Chemin vers le fichier vidéo.
        output_dir (str): Répertoire de destination pour le fichier audio.
    """
    input_path = Path(input_file)
    output_file = os.path.join(output_dir, f"{input_path.stem}.wav")
    
    print(f"Extraction de l'audio depuis {input_file} vers {output_file}...")
    
    # Commande ffmpeg pour extraire l'audio
    ffmpeg_cmd = [
        "ffmpeg", "-i", input_file,
        "-vn",              # Pas de vidéo
        "-acodec", "pcm_s16le", # Codec audio WAV
        "-ar", "16000",     # Taux d'échantillonnage 16kHz
        "-ac", "1",         # Mono
        output_file,
        "-y"                # Écraser si le fichier existe
    ]
    
    try:
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Extraction réussie : {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'extraction de {input_file} : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extraction audio depuis des vidéos pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Fichier vidéo d'entrée ou répertoire contenant des vidéos.")
    parser.add_argument("--output", type=str, default="../donnees/audio_extrait", help="Répertoire de sortie.")
    
    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    if os.path.isdir(args.input):
        for file in os.listdir(args.input):
            if file.endswith(('.mp4', '.mkv', '.avi', '.webm')):
                extract_audio(os.path.join(args.input, file), args.output)
    else:
        extract_audio(args.input, args.output)
