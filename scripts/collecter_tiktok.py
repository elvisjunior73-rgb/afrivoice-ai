import os
import argparse
import yt_dlp
from datetime import datetime

def download_tiktok_audio(url, language, output_dir):
    """
    Télécharge l'audio d'une vidéo TikTok.
    
    Args:
        url (str): L'URL de la vidéo TikTok.
        language (str): Le code de la langue (lin, kon, sag).
        output_dir (str): Le répertoire de destination.
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Début du téléchargement TikTok pour la langue : {language}")
    
    # Configuration de yt-dlp pour extraire l'audio au format WAV (16kHz, mono)
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'postprocessor_args': [
            '-ar', '16000',  # Taux d'échantillonnage 16kHz
            '-ac', '1'       # Mono
        ],
        'outtmpl': os.path.join(output_dir, f'%(id)s_{language}.%(ext)s'),
        'ignoreerrors': True,
        'quiet': False,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Téléchargement terminé avec succès.")
    except Exception as e:
        print(f"Erreur lors du téléchargement : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collecte d'audio depuis TikTok pour AfriVoice AI.")
    parser.add_argument("--url", type=str, required=True, help="URL de la vidéo TikTok.")
    parser.add_argument("--lang", type=str, required=True, choices=['lin', 'kon', 'sag'], help="Code de la langue (lin, kon, sag).")
    parser.add_argument("--output", type=str, default="../donnees/brutes", help="Répertoire de sortie.")
    
    args = parser.parse_args()
    
    # Création du répertoire de sortie s'il n'existe pas
    os.makedirs(args.output, exist_ok=True)
    
    download_tiktok_audio(args.url, args.lang, args.output)
