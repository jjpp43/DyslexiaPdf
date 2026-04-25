from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os

router = APIRouter(prefix="/tts", tags=["tts"])


class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-Neural2-D"
    language_code: str = "en-US"


@router.post("/synthesize")
async def synthesize(req: TTSRequest):
    api_key = os.environ.get("GOOGLE_TTS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_TTS_API_KEY not configured")

    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
    payload = {
        "input": {"text": req.text[:5000]},  # cap at 5000 chars
        "voice": {"languageCode": req.language_code, "name": req.voice},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": 1.0},
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        res.raise_for_status()
        audio_content = res.json().get("audioContent")
        if not audio_content:
            raise HTTPException(status_code=500, detail="No audio returned from TTS API")
        return {"audio": audio_content}
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"TTS API error: {e.response.text}")
