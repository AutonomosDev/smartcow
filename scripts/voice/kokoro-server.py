#!/usr/bin/env python3
"""kokoro-server.py — Sidecar HTTP TTS via Kokoro ONNX.

AUT-395 fase 2. Voz sintética local en español, sin nube.

Endpoint:
  POST /synthesize  { "text": "...", "voice": "ef_dora", "speed": 1.0 }
  → { "audio_b64": "...", "format": "wav", "sr": 24000, "elapsed_ms": N }

Variables:
  KOKORO_PORT     (default: 3006)
  KOKORO_MODEL    (default: .claude/voice-models/kokoro-v1.0.onnx)
  KOKORO_VOICES   (default: .claude/voice-models/voices-v1.0.bin)
  DEFAULT_VOICE   (default: ef_dora)

Voces ES disponibles: ef_dora · em_alex · em_santa
"""
import base64
import io
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
PORT = int(os.environ.get("KOKORO_PORT", 3006))
MODEL = Path(os.environ.get(
    "KOKORO_MODEL", str(REPO / ".claude" / "voice-models" / "kokoro-v1.0.onnx")
))
VOICES = Path(os.environ.get(
    "KOKORO_VOICES", str(REPO / ".claude" / "voice-models" / "voices-v1.0.bin")
))
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "ef_dora")

# carga eager para falla fast
print("⏳ cargando Kokoro...", flush=True)
KOKORO = Kokoro(str(MODEL), str(VOICES))
AVAILABLE_VOICES = sorted(KOKORO.get_voices())
print(f"✓ Kokoro listo · {len(AVAILABLE_VOICES)} voces", flush=True)


def synthesize(text: str, voice: str = DEFAULT_VOICE, speed: float = 1.0) -> tuple[bytes, int, int]:
    """Genera wav y devuelve (audio_bytes, sr, elapsed_ms)."""
    t0 = time.time()
    samples, sr = KOKORO.create(text, voice=voice, speed=speed, lang="es")
    buf = io.BytesIO()
    sf.write(buf, np.asarray(samples), sr, format="WAV", subtype="PCM_16")
    elapsed = int((time.time() - t0) * 1000)
    return buf.getvalue(), sr, elapsed


class KokoroHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        pass

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(200, {
                "ok": True,
                "model": str(MODEL),
                "voices_total": len(AVAILABLE_VOICES),
                "voices_es": [v for v in AVAILABLE_VOICES if v.startswith("e")],
                "default_voice": DEFAULT_VOICE,
            })
            return
        if self.path == "/voices":
            self._send_json(200, {"voices": AVAILABLE_VOICES})
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/synthesize":
            self._send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)
        except Exception as e:
            self._send_json(400, {"error": f"json inválido: {e}"})
            return

        text = (data.get("text") or "").strip()
        if not text:
            self._send_json(400, {"error": "falta text"})
            return
        voice = data.get("voice") or DEFAULT_VOICE
        if voice not in AVAILABLE_VOICES:
            self._send_json(400, {
                "error": f"voz desconocida: {voice}",
                "available": AVAILABLE_VOICES,
            })
            return
        try:
            speed = float(data.get("speed", 1.0))
        except (TypeError, ValueError):
            speed = 1.0
        speed = max(0.5, min(2.0, speed))

        try:
            audio_bytes, sr, elapsed = synthesize(text, voice=voice, speed=speed)
            audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
            self._send_json(200, {
                "audio_b64": audio_b64,
                "format": "wav",
                "sr": sr,
                "voice": voice,
                "speed": speed,
                "elapsed_ms": elapsed,
                "bytes": len(audio_bytes),
            })
        except Exception as e:
            self._send_json(500, {"error": str(e)})


def main() -> int:
    if not MODEL.exists() or not VOICES.exists():
        print(f"❌ modelos no existen: {MODEL} / {VOICES}", file=sys.stderr)
        return 2
    print(f"🔊 kokoro-server :{PORT} → voz default={DEFAULT_VOICE}")
    server = HTTPServer(("127.0.0.1", PORT), KokoroHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
