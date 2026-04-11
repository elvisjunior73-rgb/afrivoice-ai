import os
import argparse
import subprocess
from datetime import datetime

def download_radio_stream(url, language, duration, output_dir):
    """
    Enregistre un flux radio en direct via streamlink.
    
    Args:
        url (str): L'URL du flux radio.
        language (str): Le code de la langue (lin, kon, sag).
        duration (int): La durée d'enregistrement en secondes.
        output_dir (str): Le répertoire de destination.
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Début de l'enregistrement radio pour la langue : {language}")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = os.path.join(output_dir, f"radio_{language}_{timestamp}.wav")
    
    # Commande streamlink pour capturer le flux et le passer à ffmpeg pour conversion
    # streamlink <url> best -O | ffmpeg -i pipe:0 -t <duration> -ar 16000 -ac 1 <output_file>
    
    streamlink_cmd = ["streamlink", url, "best", "-O"]
    ffmpeg_cmd = [
        "ffmpeg", "-i", "pipe:0",
        "-t", str(duration),
        "-ar", "16000",
        "-ac", "1",
        output_file
    ]
    
    try:
        # Lancement de streamlink
        p1 = subprocess.Popen(streamlink_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        # Lancement de ffmpeg qui lit la sortie de streamlink
        p2 = subprocess.Popen(ffmpeg_cmd, stdin=p1.stdout, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        p1.stdout.close()  # Permet à p1 de recevoir un SIGPIPE si p2 se termine
        p2.communicate()
        
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Enregistrement terminé : {output_file}")
    except Exception as e:
        print(f"Erreur lors de l'enregistrement : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collecte d'audio depuis des flux radio pour AfriVoice AI.")
    parser.add_argument("--url", type=str, required=True, help="URL du flux radio.")
    parser.add_argument("--lang", type=str, required=True, choices=['lin', 'kon', 'sag'], help="Code de la langue (lin, kon, sag).")
    parser.add_argument("--duration", type=int, default=3600, help="Durée d'enregistrement en secondes (défaut: 3600s = 1h).")
    parser.add_argument("--output", type=str, default="../donnees/brutes", help="Répertoire de sortie.")
    
    args = parser.parse_args()
    
    # Création du répertoire de sortie s'il n'existe pas
    os.makedirs(args.output, exist_ok=True)
    
    download_radio_stream(args.url, args.lang, args.duration, args.output)
