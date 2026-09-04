"""Download Gen 1-3 cries from the PokeAPI repository, keeping valid local files."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen, Request
import os
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "audio" / "cries"
BASE = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/"

def fetch(pokemon_id):
    target = DEST / f"{pokemon_id}.ogg"
    if target.is_file() and target.read_bytes().startswith(b"OggS"): return None
    for attempt in range(3):
        try:
            source = BASE.replace("/latest/", "/legacy/") if pokemon_id == 25 else BASE
            with urlopen(Request(source + f"{pokemon_id}.ogg", headers={"User-Agent":"HoennKantoWiki-assets/1.0"}), timeout=30) as response:
                raw = response.read(2_000_001)
            if not raw.startswith(b"OggS") or len(raw)>2_000_000: raise ValueError("Invalid Ogg")
            fd, temporary = tempfile.mkstemp(dir=DEST, prefix=".cry-")
            try:
                with os.fdopen(fd, "wb") as output: output.write(raw)
                os.replace(temporary, target)
            finally:
                if os.path.exists(temporary): os.unlink(temporary)
            return None
        except Exception as error:
            if attempt == 2: return f"{pokemon_id}: {error}"
            time.sleep(attempt + 1)

if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        errors = [error for error in pool.map(fetch, range(1,387)) if error]
    print(f"{len(list(DEST.glob('*.ogg')))}/386 cries locais", flush=True)
    for error in errors: print(error)
    raise SystemExit(bool(errors))
