import os
import json
import argparse
import subprocess
from datetime import datetime
import yt_dlp
import boto3
from botocore.client import Config

def charger_catalogue(fichier_catalogue):
    """Charge le catalogue des sources depuis un fichier JSON."""
    if not os.path.exists(fichier_catalogue):
        print(f"Erreur : Le fichier catalogue {fichier_catalogue} n'existe pas.")
        return {}
    with open(fichier_catalogue, 'r', encoding='utf-8') as f:
        return json.load(f)

def mettre_a_jour_suivi(fichier_suivi, langue, source_id, duree_secondes, statut):
    """Met à jour le fichier de suivi de progression."""
    suivi = {}
    if os.path.exists(fichier_suivi):
        with open(fichier_suivi, 'r', encoding='utf-8') as f:
            suivi = json.load(f)
            
    if langue not in suivi:
        suivi[langue] = {"total_secondes": 0, "historique": []}
        
    entree = {
        "date": datetime.now().isoformat(),
        "source_id": source_id,
        "duree_secondes": duree_secondes,
        "statut": statut
    }
    
    suivi[langue]["historique"].append(entree)
    if statut == "succes":
        suivi[langue]["total_secondes"] += duree_secondes
        
    with open(fichier_suivi, 'w', encoding='utf-8') as f:
        json.dump(suivi, f, indent=4, ensure_ascii=False)

def collecter_youtube(url, langue, output_dir):
    """Collecte l'audio depuis YouTube avec yt-dlp."""
    print(f"[{datetime.now().isoformat()}] Collecte YouTube : {url} ({langue})")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'postprocessor_args': ['-ar', '16000', '-ac', '1'],
        'outtmpl': os.path.join(output_dir, f'%(id)s_{langue}.%(ext)s'),
        'ignoreerrors': True,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': 'in_playlist', # Pour ne pas télécharger toute la playlist d'un coup si c'est une chaîne
        'max_downloads': 5 # Limite par exécution pour éviter les blocages
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Estimation grossière de la durée (en réalité il faudrait analyser les fichiers WAV générés)
            duree = info.get('duration', 0) if info else 0
            return True, duree
    except Exception as e:
        print(f"Erreur YouTube ({url}) : {e}")
        return False, 0

def collecter_radio(url, langue, duree, output_dir):
    """Collecte l'audio depuis un flux radio avec streamlink."""
    print(f"[{datetime.now().isoformat()}] Collecte Radio : {url} ({langue}) pour {duree}s")
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = os.path.join(output_dir, f"radio_{langue}_{timestamp}.wav")
    
    streamlink_cmd = ["streamlink", url, "best", "-O"]
    ffmpeg_cmd = [
        "ffmpeg", "-i", "pipe:0",
        "-t", str(duree),
        "-ar", "16000",
        "-ac", "1",
        output_file,
        "-y"
    ]
    
    try:
        p1 = subprocess.Popen(streamlink_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        p2 = subprocess.Popen(ffmpeg_cmd, stdin=p1.stdout, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        p1.stdout.close()
        p2.communicate(timeout=duree + 60) # Timeout de sécurité
        
        if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
            return True, duree
        else:
            return False, 0
    except subprocess.TimeoutExpired:
        p2.kill()
        return True, duree # Le timeout est normal pour un flux continu
    except Exception as e:
        print(f"Erreur Radio ({url}) : {e}")
        return False, 0

def upload_to_s3(file_path, langue):
    """Upload un fichier vers Cloudflare R2 (S3)"""
    s3_endpoint = os.environ.get("S3_ENDPOINT")
    s3_access_key = os.environ.get("S3_ACCESS_KEY")
    s3_secret_key = os.environ.get("S3_SECRET_KEY")
    s3_bucket = os.environ.get("S3_BUCKET_NAME")
    
    if not all([s3_endpoint, s3_access_key, s3_secret_key, s3_bucket]):
        print("⚠️ Variables d'environnement S3 manquantes. Upload ignoré.")
        return False
        
    try:
        s3 = boto3.client('s3',
            endpoint_url=s3_endpoint,
            aws_access_key_id=s3_access_key,
            aws_secret_access_key=s3_secret_key,
            config=Config(signature_version='s3v4')
        )
        
        file_name = os.path.basename(file_path)
        s3_key = f"brutes/{langue}/{file_name}"
        
        print(f"⬆️ Upload vers R2 : {s3_key}...")
        s3.upload_file(file_path, s3_bucket, s3_key)
        print(f"✅ Upload réussi : {s3_key}")
        
        # Supprimer le fichier local après upload réussi pour économiser l'espace
        os.remove(file_path)
        return True
    except Exception as e:
        print(f"❌ Erreur d'upload S3 : {e}")
        return False

def executer_collecte(catalogue_path, suivi_path, output_base_dir, s3_upload=False):
    """Exécute la collecte pour toutes les sources du catalogue."""
    catalogue = charger_catalogue(catalogue_path)
    
    for langue, sources in catalogue.items():
        output_dir = os.path.join(output_base_dir, langue)
        os.makedirs(output_dir, exist_ok=True)
        
        for source in sources:
            if not source.get("actif", True):
                continue
                
            type_source = source.get("type")
            url = source.get("url")
            source_id = source.get("id", url)
            
            succes = False
            duree = 0
            
            if type_source == "youtube":
                succes, duree = collecter_youtube(url, langue, output_dir)
            elif type_source == "radio":
                duree_cible = source.get("duree_secondes", 3600) # 1h par défaut
                succes, duree = collecter_radio(url, langue, duree_cible, output_dir)
            else:
                print(f"Type de source inconnu : {type_source}")
                continue
                
            statut = "succes" if succes else "echec"
            mettre_a_jour_suivi(suivi_path, langue, source_id, duree, statut)
            
            # Upload S3 si demandé
            if s3_upload and succes:
                for f in os.listdir(output_dir):
                    file_path = os.path.join(output_dir, f)
                    if os.path.isfile(file_path):
                        upload_to_s3(file_path, langue)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Moteur de collecte automatique multi-sources.")
    parser.add_argument("--catalogue", type=str, default="../configurations/sources.json", help="Chemin vers le catalogue JSON.")
    parser.add_argument("--suivi", type=str, default="../donnees/suivi_collecte.json", help="Chemin vers le fichier de suivi.")
    parser.add_argument("--output", type=str, default="../donnees/brutes", help="Répertoire de base pour les sorties.")
    parser.add_argument("--s3-upload", action="store_true", help="Uploader les fichiers vers S3/R2 après collecte")
    
    args = parser.parse_args()
    
    os.makedirs(os.path.dirname(args.suivi), exist_ok=True)
    executer_collecte(args.catalogue, args.suivi, args.output, args.s3_upload)
