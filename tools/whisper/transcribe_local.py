import json, os, sys, whisper

audio = sys.argv[1]
out = sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else "large-v3"

model = whisper.load_model(model_name)
result = model.transcribe(audio, language="ja", word_timestamps=True)

words = []
for seg in result["segments"]:
    for w in seg.get("words", []):
        words.append({
            "word": w["word"].strip(),
            "start": round(float(w["start"]), 3),
            "end": round(float(w["end"]), 3),
        })

output = {
    "words": words,
    "text": result.get("text", "").strip(),
    "language": "ja",
    "duration": round(words[-1]["end"], 3) if words else None,
}
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"saved {len(words)} words -> {out}")
