import os
import argparse
import torch
import torchaudio
from pathlib import Path

def segment_audio(audio_file, output_dir, min_duration=5.0, max_duration=30.0):
    """
    Découpe un fichier audio en segments de 5 à 30 secondes en utilisant Silero VAD.
    
    Args:
        audio_file (str): Chemin vers le fichier audio.
        output_dir (str): Répertoire de destination pour les segments.
        min_duration (float): Durée minimale d'un segment en secondes.
        max_duration (float): Durée maximale d'un segment en secondes.
    """
    print(f"Segmentation de {audio_file}...")
    
    # Chargement du modèle Silero VAD
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                  model='silero_vad',
                                  force_reload=False)
    
    (get_speech_timestamps,
     save_audio,
     read_audio,
     VADIterator,
     collect_chunks) = utils
    
    # Lecture de l'audio
    wav = read_audio(audio_file, sampling_rate=16000)
    
    # Obtention des timestamps de parole
    speech_timestamps = get_speech_timestamps(wav, model, sampling_rate=16000)
    
    # Découpage et sauvegarde des segments
    base_name = Path(audio_file).stem
    segment_count = 0
    
    for i, ts in enumerate(speech_timestamps):
        start_sample = ts['start']
        end_sample = ts['end']
        duration = (end_sample - start_sample) / 16000.0
        
        if min_duration <= duration <= max_duration:
            segment_wav = wav[start_sample:end_sample]
            output_file = os.path.join(output_dir, f"{base_name}_seg{segment_count:04d}.wav")
            save_audio(output_file, segment_wav, sampling_rate=16000)
            segment_count += 1
            
    print(f"Créé {segment_count} segments pour {audio_file}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Segmentation audio pour AfriVoice AI.")
    parser.add_argument("--input", type=str, required=True, help="Fichier audio d'entrée ou répertoire.")
    parser.add_argument("--output", type=str, default="../donnees/segments", help="Répertoire de sortie pour les segments.")
    
    args = parser.parse_args()
    
    os.makedirs(args.output, exist_ok=True)
    
    if os.path.isdir(args.input):
        for file in os.listdir(args.input):
            if file.endswith('.wav'):
                segment_audio(os.path.join(args.input, file), args.output)
    else:
        segment_audio(args.input, args.output)
