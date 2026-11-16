# Makes the story narration (Home · Supermarket · Japan) with the Kokoro voice. Run by .github/workflows/voice.yml
import soundfile as sf, numpy as np, subprocess
from kokoro import KPipeline
LINES = [
  "This is one. Home! He lies on the couch, eating crisps. Crunch, crunch. Mum and Dad say, that's enough! But he doesn't listen.",
  "Oh no! The crisps are gone! So he goes to four. The supermarket! And he buys more.",
  "Back home, to one. The couch, the crisps. Crunch, crunch.",
  "Gone again! Off to the supermarket, four. And home again, one. Again, and again!",
  "Home, shop. Home, shop. Hmm. This is getting boring.",
  "So he flies to five. Japan! Temples, sushi, Mount Fuji. So much to see!",
  "And then, back home, to one. Ahh, the couch. One is always home.",
]
p = KPipeline(lang_code="b")   # British English
for i, txt in enumerate(LINES, 1):
    audio = np.concatenate([a for _, _, a in p(txt, voice="bf_emma", speed=0.92)])
    audio = np.concatenate([np.zeros(2400), audio, np.zeros(4800)])
    sf.write("/tmp/v.wav", audio, 24000)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", "/tmp/v.wav", "-ac", "1", "-b:a", "64k", f"assets/voice/cp{i}.mp3"], check=True)
    print(i, len(audio) / 24000)
