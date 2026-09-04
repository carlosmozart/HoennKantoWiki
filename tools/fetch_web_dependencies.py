"""Download the existing font and screenshot library for offline use."""
from pathlib import Path
from urllib.request import urlopen, Request
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
SOURCES={
    "vendor/html2canvas/html2canvas.min.js":"https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "vendor/html2canvas/LICENSE":"https://raw.githubusercontent.com/niklasvh/html2canvas/v1.4.1/LICENSE",
    "fonts/Oxanium.ttf":"https://raw.githubusercontent.com/google/fonts/main/ofl/oxanium/Oxanium%5Bwght%5D.ttf",
    "fonts/OFL.txt":"https://raw.githubusercontent.com/google/fonts/main/ofl/oxanium/OFL.txt",
}
if __name__=="__main__":
    records=[]
    for name,url in SOURCES.items():
        with urlopen(Request(url,headers={"User-Agent":"HoennKantoWiki-build/1.0"}),timeout=30) as response:
            raw=response.read(2_000_001)
        if not raw or len(raw)>2_000_000: raise ValueError("Invalid download: "+name)
        if name.endswith(".ttf") and raw[:4] not in (b"\x00\x01\x00\x00",b"OTTO"): raise ValueError("Invalid font.")
        target=ROOT/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(raw)
        records.append({"path":name,"url":url,"sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw)})
        print(name,len(raw),flush=True)
    (ROOT/"vendor/sources.json").write_text(json.dumps(records,indent=2)+"\n",encoding="utf-8")
