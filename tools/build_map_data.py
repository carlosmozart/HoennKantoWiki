"""Derive the offline map from the existing per-Pokemon Gen 3 encounters."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
VERSIONS=("ruby","sapphire","emerald","firered","leafgreen")
def build(root=ROOT):
    root=Path(root).resolve()
    result={version:{} for version in VERSIONS}
    for file in sorted((root/"data/pokemon").glob("*.json")):
        pokemon=json.loads(file.read_text(encoding="utf-8"))
        for version,areas in pokemon.get("locais",{}).items():
            if version not in result: continue
            for area,methods in areas.items():
                for method,detail in methods.items():
                    result[version].setdefault(area,{}).setdefault(method,[]).append({
                        "id":pokemon["id"],"name":pokemon["nome"],
                        "minLevel":detail["min"],"maxLevel":detail["max"],"chance":detail["chance"]})
    target=root/"data/map-encounters.json"
    target.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("Offline map:",sum(len(v) for v in result.values()),"areas by version,",target.stat().st_size,"bytes",flush=True)
if __name__=="__main__": build()
