import sys
from faster_whisper import WhisperModel

# Carrega o modelo uma única vez (small ~244 MB, boa precisão PT-BR em CPU)
model = WhisperModel("small", device="cpu", compute_type="int8")

# Sinaliza ao Node.js que o daemon está pronto para receber paths
print("READY", flush=True)

for line in sys.stdin:
    audio_path = line.strip()
    if not audio_path:
        continue
    try:
        segments, _ = model.transcribe(audio_path, language="pt", beam_size=5)
        text = " ".join(s.text.strip() for s in segments).strip()
        print(text if text else "ERROR:empty", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", flush=True)
