import os
import argparse
import whisper
from pathlib import Path

def detect_language(audio_file, target_lang):
    """
    Détecte la langue d'un fichier audio en utilisant Whisper.
    
    Args:
        audio_file (str): Chemin vers le fichier audio.
        target_lang (str): Code de la langue cible (lin, kon, sag).
    
    Returns:
        bool: True si la langue détectée correspond à la langue cible, False sinon.
    """
    print(f"Détection de la langue pour {audio_file}...")
    
    # Chargement du modèle Whisper (base pour la détection rapide)
    model = whisper.load_model("base")
    
    # Chargement de l'audio et padding/trimming pour s'adapter à 30 secondes
    audio = whisper.load_audio(audio_file)
    audio = whisper.pad_or_trim(audio)
    
    # Création du spectrogramme Mel
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    
    # Détection de la langue
    _, probs = model.detect_language(mel)
    detected_lang = max(probs, key=probs.get)
    
    print(f"Langue détectée : {detected_lang} avec une probabilité de {probs[detected_lang]:.2f}")
    
    # Note: Whisper ne supporte pas nativement le Lingala, Kikongo ou Sango avec des codes spécifiques
    # Il peut les détecter comme du français ou d'autres langues africaines.
    # Pour l'instant, on utilise une heuristique simple ou on accepte tout si la probabilité est faible.
    # Dans un vrai scénario, un modèle spécifique de détection de langue serait nécessaire.
    
    # Heuristique simplifiée : on accepte si ce n'est pas clairement de l'anglais ou du français avec une forte probabilité
    if detected_lang in ['en', 'fr'] and probs[detected_lang] > 0.8:
        print(f"Rejeté : Langue détectée {detected_lang} avec forte probabilité.")
        return False
    
    print(f"Accepté : Langue potentiellement {target_lang}.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Détection de langue pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Fichier audio d'entrée ou répertoire.")
    parser.add_argument("--lang", type=str, required=True, choices=['lin', 'kon', 'sag'], help="Code de la langue cible (lin, kon, sag).")
    parser.add_argument("--output", type=str, default="../donnees/langue_filtree", help="Répertoire de sortie pour les fichiers acceptés.")
    
    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    if os.path.isdir(args.input):
        for file in os.listdir(args.input):
            if file.endswith('.wav'):
                file_path = os.path.join(args.input, file)
                if detect_language(file_path, args.lang):
                    # Déplacer ou copier le fichier vers le répertoire de sortie
                    output_path = os.path.join(args.output, file)
                    os.rename(file_path, output_path)
                    print(f"Fichier déplacé vers {output_path}")
    else:
        if detect_language(args.input, args.lang):
            output_path = os.path.join(args.output, os.path.basename(args.input))
            os.rename(args.input, output_path)
            print(f"Fichier déplacé vers {output_path}")
