from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import uuid
from faster_whisper import WhisperModel
import uvicorn

app = FastAPI(title="AfriVoice AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation du modèle Whisper (large-v3)
# En production, cela devrait tourner sur un GPU (RunPod)
print("Chargement du modèle Whisper...")
model = WhisperModel("large-v3", device="cpu", compute_type="int8")
print("Modèle chargé.")

@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("lin")
):
    """
    Reçoit un fichier audio, le transcrit avec Whisper et renvoie le texte.
    """
    if not audio.filename.endswith(('.wav', '.webm', '.mp3', '.ogg')):
        raise HTTPException(status_code=400, detail="Format audio non supporté")

    # Sauvegarder l'audio temporairement
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        content = await audio.read()
        temp_audio.write(content)
        temp_audio_path = temp_audio.name

    try:
        # Transcription avec faster-whisper
        segments, info = model.transcribe(
            temp_audio_path,
            beam_size=5,
            language=language if language in ["lin", "sag"] else None # Kikongo non supporté nativement par Whisper
        )
        
        text = " ".join([segment.text for segment in segments])
        
        # Nettoyage
        os.unlink(temp_audio_path)
        
        return {
            "text": text.strip(),
            "language": info.language,
            "language_probability": info.language_probability
        }
    except Exception as e:
        if os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse
import subprocess

@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    language: str = Form("lin")
):
    """
    Génère de l'audio à partir du texte.
    Pour l'instant, utilise un TTS basique (espeak) comme placeholder fonctionnel.
    En production, utiliser Coqui TTS ou un modèle fine-tuné.
    """
    output_path = f"/tmp/{uuid.uuid4()}.wav"
    
    # Mapping des langues pour espeak (approximation)
    voice = "fr" # Par défaut, voix française pour lire les langues africaines
    
    try:
        # Utilisation de espeak pour générer l'audio
        subprocess.run(["espeak", "-v", voice, "-w", output_path, text], check=True)
        
        return FileResponse(
            output_path, 
            media_type="audio/wav",
            filename="response.wav"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur TTS: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
