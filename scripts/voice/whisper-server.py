#!/usr/bin/env python3
"""whisper-server.py — Sidecar HTTP que transcribe audio a texto.

AUT-395 fase 1. Wrapper sobre whisper-cli (whisper.cpp) compilado nativo
para Apple Silicon.

Endpoint:
  POST /transcribe   { "audio_b64": "...", "lang": "es" }
  → { "text": "...", "lang": "es", "elapsed_ms": N }

Variables:
  WHISPER_PORT     (default: 3005)
  WHISPER_MODEL    (default: .claude/voice-models/ggml-small.bin)
  WHISPER_BIN      (default: whisper-cli en PATH)

Uso:
  .venv-vanna/bin/python scripts/voice/whisper-server.py
"""
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
PORT = int(os.environ.get("WHISPER_PORT", 3005))
MODEL = Path(os.environ.get(
    "WHISPER_MODEL",
    str(REPO / ".claude" / "voice-models" / "ggml-small.bin"),
))
BIN = os.environ.get("WHISPER_BIN", "whisper-cli")
FFMPEG = os.environ.get("FFMPEG_BIN", "/opt/homebrew/bin/ffmpeg")


def transcribe_wav(wav_path: Path, lang: str = "es") -> tuple[str, int]:
    """Llama whisper-cli y devuelve (texto, elapsed_ms)."""
    t0 = time.time()
    proc = subprocess.run(
        [
            BIN,
            "-m", str(MODEL),
            "-f", str(wav_path),
            "-l", lang,
            "--no-timestamps",
            "-np",  # no print all (silenciar progreso)
        ],
        capture_output=True,
        text=True,
        timeout=60,
    )
    elapsed = int((time.time() - t0) * 1000)
    if proc.returncode != 0:
        raise RuntimeError(f"whisper-cli rc={proc.returncode}: {proc.stderr[:200]}")
    # Filtrar líneas de log; quedarse con texto real
    out_lines = [
        ln.strip()
        for ln in proc.stdout.splitlines()
        if ln.strip()
        and not ln.startswith(("ggml_", "whisper_", "load_", "main:", "whisper :"))
    ]
    text = " ".join(out_lines).strip()
    # Whisper a veces devuelve "Hola. Soy..." con punto inicial; limpio
    text = re.sub(r"^[\s.]+", "", text)
    return text, elapsed


def webm_or_b64_to_wav(audio_bytes: bytes) -> Path:
    """Acepta cualquier formato (webm, mp3, wav, m4a) y devuelve path a
    wav 16kHz mono pcm_s16le que whisper-cpp puede leer."""
    in_fd, in_path = tempfile.mkstemp(suffix=".audio")
    out_fd, out_path = tempfile.mkstemp(suffix=".wav")
    os.close(in_fd)
    os.close(out_fd)
    Path(in_path).write_bytes(audio_bytes)
    proc = subprocess.run(
        [
            FFMPEG, "-y", "-i", in_path,
            "-ar", "16000", "-ac", "1",
            "-c:a", "pcm_s16le",
            out_path,
        ],
        capture_output=True, text=True, timeout=30,
    )
    Path(in_path).unlink(missing_ok=True)
    if proc.returncode != 0:
        Path(out_path).unlink(missing_ok=True)
        raise RuntimeError(f"ffmpeg rc={proc.returncode}: {proc.stderr[:200]}")
    return Path(out_path)


class WhisperHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # silenciar request log
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
                "model_exists": MODEL.exists(),
                "bin": BIN,
            })
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/transcribe":
            self._send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)
        except Exception as e:
            self._send_json(400, {"error": f"json inválido: {e}"})
            return

        b64 = data.get("audio_b64")
        if not b64:
            self._send_json(400, {"error": "falta audio_b64"})
            return
        lang = (data.get("lang") or "es").lower()

        wav_path = None
        try:
            audio_bytes = base64.b64decode(b64)
            wav_path = webm_or_b64_to_wav(audio_bytes)
            text, elapsed = transcribe_wav(wav_path, lang)
            self._send_json(200, {
                "text": text,
                "lang": lang,
                "elapsed_ms": elapsed,
            })
        except Exception as e:
            self._send_json(500, {"error": str(e)})
        finally:
            if wav_path:
                wav_path.unlink(missing_ok=True)


def main() -> int:
    if not MODEL.exists():
        print(f"❌ modelo no existe: {MODEL}", file=sys.stderr)
        return 2
    print(f"🎤 whisper-server :{PORT} → model={MODEL.name}")
    server = HTTPServer(("127.0.0.1", PORT), WhisperHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
