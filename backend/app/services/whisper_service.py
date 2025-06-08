import asyncio
from faster_whisper import WhisperModel

class WhisperService:
    def __init__(self, model_size: str = "base"):
        # Download and load the model
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    async def transcribe(self, audio_path: str) -> str:
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._transcribe_sync, audio_path)
            return result
        except Exception as e:
            raise Exception(f"Whisper transcription failed: {str(e)}")
    
    def _transcribe_sync(self, audio_path: str) -> str:
        segments, info = self.model.transcribe(audio_path, beam_size=5)
        
        # Combine all segments into one text
        text = ""
        for segment in segments:
            text += segment.text
        
        return text.strip()