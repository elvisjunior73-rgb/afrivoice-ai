#!/usr/bin/env python3
"""
transcription_whisper.py — Transcription audio locale via OpenAI Whisper
Remplace le cluster RunPod pour la transcription des fichiers audio collectés.

Usage :
    python scripts/transcription_whisper.py \
        --input donnees/brutes \
        --output donnees/transcriptions \
        --suivi donnees/suivi_collecte.json \
        --modele small
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime
from pathlib import Path


def charger_suivi(fichier_suivi: str) -> dict:
    """Charge le fichier de suivi JSON."""
    if os.path.exists(fichier_suivi):
        with open(fichier_suivi, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def sauvegarder_suivi(fichier_suivi: str, suivi: dict):
    """Sauvegarde le fichier de suivi JSON."""
    with open(fichier_suivi, 'w', encoding='utf-8') as f:
        json.dump(suivi, f, ensure_ascii=False, indent=2)


def trouver_fichiers_audio(repertoire: str) -> list:
    """Trouve tous les fichiers audio WAV/MP3 dans le répertoire."""
    extensions = {'.wav', '.mp3', '.flac', '.ogg', '.m4a'}
    fichiers = []
    for root, dirs, files in os.walk(repertoire):
        for nom in sorted(files):
            if Path(nom).suffix.lower() in extensions:
                fichiers.append(os.path.join(root, nom))
    return fichiers


def transcrire_fichier(modele, chemin_audio: str, langue_code: str) -> dict:
    """
    Transcrit un fichier audio avec Whisper.
    Retourne un dict avec 'texte', 'segments', 'langue_detectee'.
    """
    # Mapping code langue → langue Whisper
    langues_whisper = {
        'lin': None,   # Lingala non supporté nativement → détection auto
        'kon': None,   # Kikongo non supporté nativement → détection auto
        'sag': None,   # Sango non supporté nativement → détection auto
        'fr':  'fr',
        'en':  'en',
    }
    langue_whisper = langues_whisper.get(langue_code)

    options = {
        'task': 'transcribe',
        'verbose': False,
    }
    if langue_whisper:
        options['language'] = langue_whisper

    try:
        result = modele.transcribe(chemin_audio, **options)
        return {
            'texte': result.get('text', '').strip(),
            'segments': len(result.get('segments', [])),
            'langue_detectee': result.get('language', 'unknown'),
            'succes': True,
            'erreur': None,
        }
    except Exception as e:
        return {
            'texte': '',
            'segments': 0,
            'langue_detectee': 'unknown',
            'succes': False,
            'erreur': str(e),
        }


def detecter_langue_depuis_chemin(chemin: str) -> str:
    """Détecte le code langue depuis le chemin du fichier (lin/kon/sag)."""
    chemin_lower = chemin.lower()
    if 'lingala' in chemin_lower or '/lin/' in chemin_lower or '_lin_' in chemin_lower:
        return 'lin'
    elif 'kikongo' in chemin_lower or '/kon/' in chemin_lower or '_kon_' in chemin_lower:
        return 'kon'
    elif 'sango' in chemin_lower or '/sag/' in chemin_lower or '_sag_' in chemin_lower:
        return 'sag'
    return 'lin'  # défaut


def main():
    parser = argparse.ArgumentParser(description='Transcription audio via Whisper')
    parser.add_argument('--input',   default='donnees/brutes',
                        help='Répertoire des fichiers audio à transcrire')
    parser.add_argument('--output',  default='donnees/transcriptions',
                        help='Répertoire de sortie des transcriptions')
    parser.add_argument('--suivi',   default='donnees/suivi_collecte.json',
                        help='Fichier de suivi JSON')
    parser.add_argument('--modele',  default='small',
                        choices=['tiny', 'base', 'small', 'medium'],
                        help='Modèle Whisper à utiliser (défaut: small)')
    parser.add_argument('--max-fichiers', type=int, default=50,
                        help='Nombre max de fichiers à transcrire par run (défaut: 50)')
    args = parser.parse_args()

    # Vérifier que le répertoire d'entrée existe
    if not os.path.exists(args.input):
        print(f"Répertoire d'entrée introuvable : {args.input}")
        print("Aucun fichier audio à transcrire — étape ignorée.")
        sys.exit(0)

    # Trouver les fichiers audio
    fichiers = trouver_fichiers_audio(args.input)
    if not fichiers:
        print(f"Aucun fichier audio trouvé dans {args.input}")
        print("Étape de transcription ignorée.")
        sys.exit(0)

    print(f"Fichiers audio trouvés : {len(fichiers)}")
    print(f"Modèle Whisper : {args.modele}")

    # Créer le répertoire de sortie
    os.makedirs(args.output, exist_ok=True)

    # Charger le suivi
    suivi = charger_suivi(args.suivi)

    # Charger le modèle Whisper
    print(f"Chargement du modèle Whisper '{args.modele}'...")
    try:
        import whisper
        modele = whisper.load_model(args.modele)
        print(f"Modèle '{args.modele}' chargé.")
    except ImportError:
        print("ERREUR : openai-whisper non installé. Exécutez : pip install openai-whisper")
        sys.exit(1)
    except Exception as e:
        print(f"ERREUR chargement modèle Whisper : {e}")
        sys.exit(1)

    # Limiter le nombre de fichiers par run
    fichiers_a_traiter = fichiers[:args.max_fichiers]
    print(f"Fichiers à transcrire ce run : {len(fichiers_a_traiter)}")

    # Statistiques globales
    stats = {
        'total': len(fichiers_a_traiter),
        'succes': 0,
        'echecs': 0,
        'segments_total': 0,
        'debut': datetime.utcnow().isoformat(),
    }

    for i, chemin_audio in enumerate(fichiers_a_traiter, 1):
        nom_fichier = os.path.basename(chemin_audio)
        langue_code = detecter_langue_depuis_chemin(chemin_audio)

        print(f"\n[{i}/{len(fichiers_a_traiter)}] {nom_fichier} (langue: {langue_code})")

        # Chemin du fichier de transcription
        nom_base = Path(nom_fichier).stem
        chemin_sortie = os.path.join(args.output, f"{nom_base}_{langue_code}.json")

        # Ignorer si déjà transcrit
        if os.path.exists(chemin_sortie):
            print(f"  → Déjà transcrit, ignoré.")
            continue

        debut = time.time()
        resultat = transcrire_fichier(modele, chemin_audio, langue_code)
        duree_traitement = time.time() - debut

        if resultat['succes']:
            stats['succes'] += 1
            stats['segments_total'] += resultat['segments']
            print(f"  ✓ {resultat['segments']} segments | "
                  f"langue détectée: {resultat['langue_detectee']} | "
                  f"{duree_traitement:.1f}s")

            # Sauvegarder la transcription
            transcription = {
                'fichier_source': chemin_audio,
                'langue_code': langue_code,
                'langue_detectee': resultat['langue_detectee'],
                'texte': resultat['texte'],
                'segments': resultat['segments'],
                'date_transcription': datetime.utcnow().isoformat(),
                'modele_whisper': args.modele,
            }
            with open(chemin_sortie, 'w', encoding='utf-8') as f:
                json.dump(transcription, f, ensure_ascii=False, indent=2)

            # Mettre à jour le suivi
            if langue_code not in suivi:
                suivi[langue_code] = {'segments_transcrits': 0, 'historique': []}
            suivi[langue_code]['segments_transcrits'] = (
                suivi[langue_code].get('segments_transcrits', 0) + resultat['segments']
            )
        else:
            stats['echecs'] += 1
            print(f"  ✗ Erreur : {resultat['erreur']}")

    # Sauvegarder le suivi mis à jour
    sauvegarder_suivi(args.suivi, suivi)

    # Rapport final
    stats['fin'] = datetime.utcnow().isoformat()
    print(f"\n{'='*60}")
    print(f"TRANSCRIPTION TERMINÉE")
    print(f"{'='*60}")
    print(f"  Fichiers traités  : {stats['total']}")
    print(f"  Succès            : {stats['succes']}")
    print(f"  Échecs            : {stats['echecs']}")
    print(f"  Segments total    : {stats['segments_total']}")
    print(f"{'='*60}")

    # Sauvegarder les stats de transcription
    stats_fichier = os.path.join(args.output, 'stats_transcription.json')
    with open(stats_fichier, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
