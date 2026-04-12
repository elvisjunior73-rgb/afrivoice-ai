import os
import json
import wave
import argparse
import subprocess
from datetime import datetime
import yt_dlp
import boto3
from botocore.client import Config


# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────

# Durée maximale par vidéo YouTube (en secondes) pour éviter les téléchargements
# de plusieurs heures. Ajustable selon les besoins.
DUREE_MAX_VIDEO_SECONDES = 600   # 10 minutes par vidéo
MAX_VIDEOS_PAR_SOURCE    = 3     # Nombre max de vidéos téléchargées par source


# ─────────────────────────────────────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────────────────────────────────────

def duree_wav(chemin_fichier: str) -> float:
    """Retourne la durée réelle d'un fichier WAV en secondes (0 si erreur)."""
    try:
        with wave.open(chemin_fichier, 'rb') as wf:
            frames = wf.getnframes()
            rate   = wf.getframerate()
            return frames / float(rate) if rate > 0 else 0.0
    except Exception:
        return 0.0


def duree_totale_repertoire(repertoire: str) -> float:
    """Somme les durées de tous les fichiers WAV présents dans un répertoire."""
    total = 0.0
    for nom in os.listdir(repertoire):
        if nom.lower().endswith('.wav'):
            total += duree_wav(os.path.join(repertoire, nom))
    return total


def charger_catalogue(fichier_catalogue: str) -> dict:
    """Charge le catalogue des sources depuis un fichier JSON."""
    if not os.path.exists(fichier_catalogue):
        print(f"Erreur : Le fichier catalogue {fichier_catalogue} n'existe pas.")
        return {}
    with open(fichier_catalogue, 'r', encoding='utf-8') as f:
        return json.load(f)


def mettre_a_jour_suivi(fichier_suivi: str, langue: str,
                         source_id: str, duree_secondes: float, statut: str):
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
        "duree_secondes": round(duree_secondes, 2),
        "statut": statut,
    }

    suivi[langue]["historique"].append(entree)
    if statut == "succes":
        suivi[langue]["total_secondes"] = round(
            suivi[langue]["total_secondes"] + duree_secondes, 2
        )

    with open(fichier_suivi, 'w', encoding='utf-8') as f:
        json.dump(suivi, f, indent=4, ensure_ascii=False)


# ─────────────────────────────────────────────────────────────────────────────
# Collecte YouTube
# ─────────────────────────────────────────────────────────────────────────────

def collecter_youtube(url: str, langue: str, output_dir: str) -> tuple[bool, float]:
    """
    Télécharge l'audio depuis YouTube/TikTok avec yt-dlp.

    Corrections appliquées par rapport à la version précédente :
    - Suppression de 'extract_flat' qui empêchait tout téléchargement réel.
    - Ajout de 'match_filter' pour ignorer les vidéos trop longues.
    - Calcul de la durée réelle à partir des fichiers WAV générés.
    - Meilleure gestion des erreurs et des playlists.
    """
    print(f"[{datetime.now().isoformat()}] Collecte YouTube : {url} ({langue})")

    # Snapshot des fichiers WAV présents AVANT le téléchargement
    fichiers_avant = set(
        f for f in os.listdir(output_dir) if f.lower().endswith('.wav')
    )

    def filtre_duree(info, *, incomplete):
        """Ignore les vidéos dont la durée dépasse DUREE_MAX_VIDEO_SECONDES."""
        duree = info.get('duration')
        if duree and duree > DUREE_MAX_VIDEO_SECONDES:
            return f"Vidéo trop longue ({duree}s > {DUREE_MAX_VIDEO_SECONDES}s), ignorée."
        return None

    ydl_opts = {
        # Format audio uniquement
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        # Rééchantillonnage à 16 kHz mono (standard ASR)
        'postprocessor_args': ['-ar', '16000', '-ac', '1'],
        # Nom de fichier de sortie
        'outtmpl': os.path.join(output_dir, f'%(id)s_{langue}.%(ext)s'),
        # Robustesse
        'ignoreerrors': True,
        'quiet': False,
        'no_warnings': False,
        # CORRECTIF : extract_flat supprimé — on télécharge vraiment l'audio
        # Limite le nombre de vidéos par source/playlist
        'max_downloads': MAX_VIDEOS_PAR_SOURCE,
        # Filtre les vidéos trop longues
        'match_filter': filtre_duree,
        # Évite de re-télécharger des fichiers déjà présents
        'nooverwrites': True,
        # Utiliser Node.js comme runtime JS pour décoder les URLs YouTube
        'extractor_args': {'youtube': {'player_client': ['web', 'android']}},
    }

    # Ajouter les cookies YouTube si disponibles (contournement anti-bot)
    cookies_file = os.environ.get('YOUTUBE_COOKIES_FILE', '')
    if cookies_file and os.path.exists(cookies_file):
        ydl_opts['cookiefile'] = cookies_file
        print(f'  → Cookies YouTube chargés depuis {cookies_file}')

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Calculer la durée réelle des nouveaux fichiers WAV générés
        fichiers_apres = set(
            f for f in os.listdir(output_dir) if f.lower().endswith('.wav')
        )
        nouveaux = fichiers_apres - fichiers_avant
        duree_reelle = sum(
            duree_wav(os.path.join(output_dir, f)) for f in nouveaux
        )

        if duree_reelle > 0:
            print(f"  → {len(nouveaux)} fichier(s) WAV, durée totale : {duree_reelle:.1f}s")
            return True, duree_reelle
        elif nouveaux:
            # Des fichiers ont été créés mais leur durée est nulle (fichiers vides/corrompus)
            print(f"  ⚠ {len(nouveaux)} fichier(s) créés mais durée = 0s (vérifier ffmpeg)")
            return True, 0.0
        else:
            print(f"  ✗ Aucun nouveau fichier WAV généré pour {url}")
            return False, 0.0

    except yt_dlp.utils.MaxDownloadsReached:
        # Limite atteinte normalement — ce n'est pas une erreur
        fichiers_apres = set(
            f for f in os.listdir(output_dir) if f.lower().endswith('.wav')
        )
        nouveaux = fichiers_apres - fichiers_avant
        duree_reelle = sum(
            duree_wav(os.path.join(output_dir, f)) for f in nouveaux
        )
        print(f"  → Limite de {MAX_VIDEOS_PAR_SOURCE} vidéos atteinte. Durée : {duree_reelle:.1f}s")
        return True, duree_reelle
    except Exception as e:
        print(f"  ✗ Erreur YouTube ({url}) : {e}")
        return False, 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Collecte Radio
# ─────────────────────────────────────────────────────────────────────────────

def collecter_radio(url: str, langue: str, duree: int, output_dir: str) -> tuple[bool, float]:
    """Collecte l'audio depuis un flux radio en direct avec streamlink + ffmpeg."""
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
        p2.communicate(timeout=duree + 60)

        if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
            duree_reelle = duree_wav(output_file)
            print(f"  → Flux radio capturé : {duree_reelle:.1f}s")
            return True, duree_reelle
        else:
            print(f"  ✗ Fichier radio absent ou vide : {output_file}")
            return False, 0.0
    except subprocess.TimeoutExpired:
        p2.kill()
        # Le timeout est normal pour un flux continu — mesurer la durée réelle
        duree_reelle = duree_wav(output_file) if os.path.exists(output_file) else float(duree)
        print(f"  → Timeout normal (flux continu). Durée : {duree_reelle:.1f}s")
        return True, duree_reelle
    except Exception as e:
        print(f"  ✗ Erreur Radio ({url}) : {e}")
        return False, 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Upload S3 / Cloudflare R2
# ─────────────────────────────────────────────────────────────────────────────

def upload_to_s3(file_path: str, langue: str) -> bool:
    """Upload un fichier vers Cloudflare R2 (compatible S3)."""
    s3_endpoint  = os.environ.get("S3_ENDPOINT")
    s3_access_key = os.environ.get("S3_ACCESS_KEY")
    s3_secret_key = os.environ.get("S3_SECRET_KEY")
    s3_bucket    = os.environ.get("S3_BUCKET_NAME")

    if not all([s3_endpoint, s3_access_key, s3_secret_key, s3_bucket]):
        print("⚠️  Variables d'environnement S3 manquantes. Upload ignoré.")
        return False

    try:
        s3 = boto3.client(
            's3',
            endpoint_url=s3_endpoint,
            aws_access_key_id=s3_access_key,
            aws_secret_access_key=s3_secret_key,
            config=Config(signature_version='s3v4'),
        )
        file_name = os.path.basename(file_path)
        s3_key = f"brutes/{langue}/{file_name}"

        print(f"⬆️  Upload vers R2 : {s3_key}...")
        s3.upload_file(file_path, s3_bucket, s3_key)
        print(f"✅ Upload réussi : {s3_key}")
        os.remove(file_path)
        return True
    except Exception as e:
        print(f"❌ Erreur d'upload S3 : {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Orchestration principale
# ─────────────────────────────────────────────────────────────────────────────

def executer_collecte(catalogue_path: str, suivi_path: str,
                       output_base_dir: str, s3_upload: bool = False):
    """Exécute la collecte pour toutes les sources du catalogue."""
    catalogue = charger_catalogue(catalogue_path)

    for langue, sources in catalogue.items():
        output_dir = os.path.join(output_base_dir, langue)
        os.makedirs(output_dir, exist_ok=True)

        for source in sources:
            if not source.get("actif", True):
                continue

            type_source = source.get("type")
            url         = source.get("url")
            source_id   = source.get("id", url)

            succes = False
            duree  = 0.0

            if type_source == "youtube":
                succes, duree = collecter_youtube(url, langue, output_dir)
            elif type_source == "tiktok":
                # TikTok est géré par yt-dlp exactement comme YouTube
                succes, duree = collecter_youtube(url, langue, output_dir)
            elif type_source == "radio":
                duree_cible = source.get("duree_secondes", 3600)
                succes, duree = collecter_radio(url, langue, duree_cible, output_dir)
            else:
                print(f"Type de source inconnu : {type_source}")
                continue

            statut = "succes" if succes else "echec"
            mettre_a_jour_suivi(suivi_path, langue, source_id, duree, statut)

            # Upload S3 si demandé
            if s3_upload and succes:
                for nom_fichier in os.listdir(output_dir):
                    file_path = os.path.join(output_dir, nom_fichier)
                    if os.path.isfile(file_path) and nom_fichier.lower().endswith('.wav'):
                        upload_to_s3(file_path, langue)


# ─────────────────────────────────────────────────────────────────────────────
# Point d'entrée
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Moteur de collecte automatique multi-sources AfriVoice AI.")
    parser.add_argument("--catalogue", type=str, default="../configurations/sources.json",
                        help="Chemin vers le catalogue JSON des sources.")
    parser.add_argument("--suivi",     type=str, default="../donnees/suivi_collecte.json",
                        help="Chemin vers le fichier de suivi de progression.")
    parser.add_argument("--output",    type=str, default="../donnees/brutes",
                        help="Répertoire de base pour les fichiers audio bruts.")
    parser.add_argument("--s3-upload", action="store_true",
                        help="Uploader les fichiers WAV vers S3/R2 après collecte.")

    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.suivi), exist_ok=True)
    executer_collecte(args.catalogue, args.suivi, args.output, args.s3_upload)
