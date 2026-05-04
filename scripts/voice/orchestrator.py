#!/usr/bin/env python3
"""orchestrator.py — Pipeline de voz E2E vía HTTP.

AUT-395 fase 3. Integra los 3 sidecars en un solo endpoint.

Flujo:
  cliente envía audio (mic) →
    1. whisper :3005 transcribe →
    2. vanna :3004 NL→SQL + narrativa →
    3. kokoro :3006 sintetiza voz →
  cliente reproduce audio respuesta

Endpoint:
  POST /chat   { audio_b64, user_id?, predio_id?, voice? }
  → { transcript, sql, rows, narrative, audio_b64,
      timings: {stt, nl2sql, tts, total} }

Variables:
  ORCH_PORT       (default: 3007)
  WHISPER_URL     (default: http://127.0.0.1:3005)
  VANNA_URL       (default: http://127.0.0.1:3004)
  KOKORO_URL      (default: http://127.0.0.1:3006)
"""
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.environ.get("ORCH_PORT", 3007))
WHISPER_URL = os.environ.get("WHISPER_URL", "http://127.0.0.1:3005")
VANNA_URL = os.environ.get("VANNA_URL", "http://127.0.0.1:3004")
KOKORO_URL = os.environ.get("KOKORO_URL", "http://127.0.0.1:3006")
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "ef_dora")


def _post(url: str, payload: dict, timeout: float = 60.0) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def stt(audio_b64: str, lang: str = "es") -> tuple[str, int]:
    r = _post(f"{WHISPER_URL}/transcribe", {"audio_b64": audio_b64, "lang": lang})
    if "error" in r:
        raise RuntimeError(f"whisper: {r['error']}")
    return r.get("text", ""), int(r.get("elapsed_ms", 0))


def nl2sql(question: str, user_id: int = 1, predio_id: int = 1) -> tuple[dict, int]:
    t0 = time.time()
    r = _post(
        f"{VANNA_URL}/chat",
        {"question": question, "user_id": user_id, "predio_id": predio_id},
        timeout=120,
    )
    return r, int((time.time() - t0) * 1000)


def tts(text: str, voice: str = DEFAULT_VOICE) -> tuple[str, int, dict]:
    r = _post(
        f"{KOKORO_URL}/synthesize",
        {"text": text, "voice": voice, "speed": 1.0},
        timeout=120,
    )
    if "error" in r:
        raise RuntimeError(f"kokoro: {r['error']}")
    return r["audio_b64"], int(r.get("elapsed_ms", 0)), {
        "sr": r.get("sr"), "format": r.get("format"),
    }


def build_narrative(vanna_resp: dict) -> str:
    """Construye lo que va a decir la voz a partir de la respuesta de Vanna."""
    if vanna_resp.get("error"):
        return f"No pude consultar la base de datos. {vanna_resp.get('error', '')}"
    narr = (vanna_resp.get("narrative") or "").strip()
    rows = vanna_resp.get("rows") or []
    if narr:
        return narr
    if not rows:
        return "Consulta ejecutada, sin resultados."
    if len(rows) == 1 and isinstance(rows[0], dict):
        bits = []
        for k, v in rows[0].items():
            bits.append(f"{k}: {v}")
        return ", ".join(bits)
    return f"Encontré {len(rows)} resultados."


class OrchHandler(BaseHTTPRequestHandler):
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
            checks = {}
            # whisper, kokoro tienen /health
            for name, url in [("whisper", WHISPER_URL), ("kokoro", KOKORO_URL)]:
                try:
                    req = urllib.request.Request(f"{url}/health", method="GET")
                    with urllib.request.urlopen(req, timeout=2) as r:
                        checks[name] = r.status == 200
                except Exception:
                    checks[name] = False
            # vanna no tiene /health; check con TCP open
            import socket
            try:
                from urllib.parse import urlparse
                u = urlparse(VANNA_URL)
                with socket.create_connection((u.hostname, u.port), timeout=2):
                    checks["vanna"] = True
            except Exception:
                checks["vanna"] = False
            self._send_json(200, {"ok": all(checks.values()), "sidecars": checks})
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/chat":
            self._send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)
        except Exception as e:
            self._send_json(400, {"error": f"json inválido: {e}"})
            return

        audio_b64 = data.get("audio_b64")
        text_input = data.get("text")
        if not audio_b64 and not text_input:
            self._send_json(400, {"error": "falta audio_b64 o text"})
            return
        user_id = int(data.get("user_id", 1))
        predio_id = int(data.get("predio_id", 1))
        voice = data.get("voice") or DEFAULT_VOICE

        timings: dict[str, int] = {}
        t_total = time.time()

        # 1. STT (si hay audio)
        try:
            if audio_b64:
                transcript, t_stt = stt(audio_b64)
                timings["stt"] = t_stt
            else:
                transcript = text_input
                timings["stt"] = 0
        except Exception as e:
            self._send_json(500, {"error": f"STT falló: {e}", "stage": "stt"})
            return

        if not transcript.strip():
            self._send_json(200, {
                "transcript": "",
                "narrative": "No te escuché bien, ¿podés repetir?",
                "audio_b64": None,
                "timings": timings,
            })
            return

        # 2. NL→SQL
        try:
            vanna_resp, t_nl = nl2sql(transcript, user_id, predio_id)
            timings["nl2sql"] = t_nl
        except Exception as e:
            self._send_json(500, {
                "error": f"vanna falló: {e}",
                "stage": "nl2sql",
                "transcript": transcript,
                "timings": timings,
            })
            return

        narrative = build_narrative(vanna_resp)

        # 3. TTS
        try:
            audio_out_b64, t_tts, audio_meta = tts(narrative, voice=voice)
            timings["tts"] = t_tts
        except Exception as e:
            # devolver narrativa textual aunque falle TTS
            audio_out_b64 = None
            audio_meta = {}
            timings["tts"] = 0
            timings["tts_error"] = str(e)[:200]

        timings["total"] = int((time.time() - t_total) * 1000)
        self._send_json(200, {
            "transcript": transcript,
            "sql": vanna_resp.get("sql"),
            "rows": vanna_resp.get("rows"),
            "narrative": narrative,
            "audio_b64": audio_out_b64,
            "audio_meta": audio_meta,
            "timings": timings,
        })


def main() -> int:
    print(f"🎙 voice-orchestrator :{PORT}")
    print(f"   STT  → {WHISPER_URL}")
    print(f"   LLM  → {VANNA_URL}")
    print(f"   TTS  → {KOKORO_URL}")
    print(f"   voz  → {DEFAULT_VOICE}")
    server = HTTPServer(("127.0.0.1", PORT), OrchHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
