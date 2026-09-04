"""Read-only project status and image reference index for the local editor."""
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime

IMAGE = re.compile(r"(?:\./)?(?:img|images|favicons)/[A-Za-z0-9_./ -]+\.(?:png|gif|jpe?g|webp)", re.I)

def git_status(root):
    def run(*args):
        result = subprocess.run(["git", "--no-optional-locks", "-C", str(root), *args],
            capture_output=True, stdin=subprocess.DEVNULL, encoding="utf-8", errors="replace", timeout=10,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if result.returncode:
            raise ValueError("Git indisponível ou pasta sem repositório.")
        return result.stdout
    try:
        records = iter(run("status", "--porcelain=v2", "--branch", "-z").split("\0"))
        result = {"available":True, "branch":"", "upstream":None, "ahead":None, "behind":None, "files":[], "fetchedAt":None}
        for record in records:
            if record.startswith("# branch.head "): result["branch"] = record[14:]
            elif record.startswith("# branch.upstream "): result["upstream"] = record[18:]
            elif record.startswith("# branch.ab "):
                ahead, behind = record[12:].split()
                result.update(ahead=int(ahead), behind=abs(int(behind)))
            elif record.startswith(("1 ", "2 ", "u ")):
                kind = record[0]
                fields = record.split(" ", {"1":8, "2":9, "u":10}[kind])
                entry = {"path":fields[-1], "status":fields[1]}
                if kind == "2": entry["previousPath"] = next(records, "")
                result["files"].append(entry)
            elif record.startswith("? "):
                result["files"].append({"path":record[2:], "status":"??"})
        fetch_path = Path(run("rev-parse", "--git-path", "FETCH_HEAD").strip())
        if not fetch_path.is_absolute(): fetch_path = root / fetch_path
        if fetch_path.is_file():
            result["fetchedAt"] = datetime.fromtimestamp(fetch_path.stat().st_mtime).astimezone().isoformat()
        return result
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return {"available":False, "message":"Status do Git indisponível. Confira a pasta pelo GitHub Desktop."}

def media_library(root):
    root = root.resolve()
    references, warnings = {}, []
    def scan(text, location):
        for match in IMAGE.finditer(text):
            path = match.group().removeprefix("./")
            references.setdefault(path, set()).add(location)
    def walk(value, location):
        if isinstance(value, str): scan(value, location)
        elif isinstance(value, dict):
            for key, child in value.items(): walk(child, location + " / " + key)
        elif isinstance(value, list):
            for index, child in enumerate(value): walk(child, location + " / " + str(index + 1))
    sources = [root/"index.html", root/"manifest.json"]
    sources += list((root/"data").rglob("*.json")) + list((root/"js").rglob("*.js")) + list((root/"css").rglob("*.css"))
    for file in sources:
        if file.is_symlink() or not file.resolve().is_relative_to(root): continue
        try:
            text = file.read_text(encoding="utf-8")
            location = file.relative_to(root).as_posix()
            if file.suffix == ".json": walk(json.loads(text), location)
            else: scan(text, location)
        except (OSError, ValueError): warnings.append(file.relative_to(root).as_posix())
    assets = []
    for folder in ("img", "images", "favicons"):
        for file in sorted((root/folder).rglob("*")):
            if file.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".gif") or not file.is_file(): continue
            if file.is_symlink() or not file.resolve().is_relative_to(root): continue
            path = file.relative_to(root).as_posix()
            uses = sorted(references.get(path, []))
            assets.append({"path":path, "size":file.stat().st_size, "references":uses,
                           "uploaded":path.startswith("img/uploads/")})
    return {"assets":assets, "warnings":warnings}
