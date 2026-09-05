"""Editor local da WikiGen3. Python 3.10+, sem dependencias externas."""
from __future__ import annotations

import argparse
import copy
import hashlib
import hmac
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import tempfile
import threading
from datetime import datetime
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit
import webbrowser
from editor_extensions import store_image, check_extensions
from editor_workspace import git_status, media_library

ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = {
    "gyms.json": "Treinadores e times",
    "key-items.json": "Itens importantes",
    "guides.json": "Guias, Safari e Sevii",
    "frontier.json": "Battle Frontier",
    "extras.json": "Presentes, trocas e exclusivos",
    "machines.json": "TMs e HMs",
    "tutors.json": "Tutores de golpes",
    "pages.json": "Páginas e modelos de cards",
    "interface.json": "Textos da interface",
    "pokemon-overrides.json": "Correções da Pokédex",
    "i18n/pt.json": "Traduções · Português",
    "i18n/en.json": "Traduções · Inglês",
}
TYPES = "normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel".split()
LIMIT = 2_000_000
LOCK = threading.Lock()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def encode(data):
    return (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def infer(values):
    """Uniao dos campos opcionais de todos os cards, sem perder dados legados."""
    kinds = {("null" if v is None else "boolean" if isinstance(v, bool) else
              "object" if isinstance(v, dict) else "array" if isinstance(v, list) else
              "number" if isinstance(v, (int, float)) else "string") for v in values}
    schema = {"types": sorted(kinds)}
    if "object" in kinds:
        objects = [v for v in values if isinstance(v, dict)]
        keys = list(dict.fromkeys(k for obj in objects for k in obj))
        schema["properties"] = {k: infer([obj[k] for obj in objects if k in obj]) for k in keys}
        schema["required"] = [k for k in keys if all(k in obj for obj in objects)]
    if "array" in kinds:
        items = [item for v in values if isinstance(v, list) for item in v]
        schema["items"] = infer(items) if items else {"types": []}
    return schema


class SafeHTML(HTMLParser):
    TAGS = set("div article section p span strong b em i u s br hr h2 h3 h4 h5 ul ol li table thead tbody tfoot tr th td small a img select option blockquote caption sub sup".split())
    ATTRS = set("class id style value colspan rowspan src alt width height loading decoding href title target rel selected".split())

    def handle_starttag(self, tag, attrs):
        if tag not in self.TAGS:
            raise ValueError(f"HTML não permitido: <{tag}>.")
        for key, value in attrs:
            if key not in self.ATTRS:
                raise ValueError(f"Atributo HTML não permitido: {key}.")
            value = value or ""
            compact = re.sub(r"\s+", "", value).lower()
            if key in ("href", "src"):
                if not (value.startswith(("https://", "http://", "#", "img/", "./img/", "images/", "./images/"))):
                    raise ValueError("Use links http(s), âncoras ou imagens locais.")
                if any(c in value for c in "\r\n\\"):
                    raise ValueError("Endereço inválido.")
            if key == "style" and (re.search(r"url|expression|@import|behavior|binding", compact) or "\\" in value):
                raise ValueError("Estilo ativo não permitido.")

    def handle_endtag(self, tag):
        if tag not in self.TAGS:
            raise ValueError(f"HTML não permitido: </{tag}>.")


def validate(value, schema, path="conteúdo"):
    actual = infer([value])["types"][0]
    allowed = schema["types"]
    if allowed and actual not in allowed:
        raise ValueError(f"{path}: tipo inválido ({actual}).")
    if "enum" in schema and value not in schema["enum"]:
        raise ValueError(f"{path}: opção inválida.")
    if isinstance(value, dict):
        if any(k in value for k in ("__proto__", "prototype", "constructor")):
            raise ValueError(f"{path}: chave inválida.")
        props = schema.get("properties", {})
        if set(value) - set(props):
            raise ValueError(f"{path}: campo desconhecido.")
        for key in schema.get("required", []):
            if key not in value:
                raise ValueError(f"{path}: falta o campo {key}.")
        for key, child in value.items():
            validate(child, props[key], f"{path}/{key}")
    elif isinstance(value, list):
        key = path.rsplit("/", 1)[-1]
        max_size = {"types": 2, "moves": 4, "silverTeam": 6, "goldTeam": 6}.get(key, 1000)
        if len(value) > max_size:
            raise ValueError(f"{path}: máximo de {max_size} entradas.")
        for i, child in enumerate(value):
            validate(child, schema.get("items", {"types": []}), f"{path}/{i}")
    elif isinstance(value, str):
        if len(value) > 300_000 or "\x00" in value:
            raise ValueError(f"{path}: texto inválido ou muito longo.")
        key = path.rsplit("/", 1)[-1]
        if not value and schema.get("allowEmpty"):
            return
        if key == "link" and value and not re.match(r"^(https?://|#(?:page|pokemon)/)", value):
            raise ValueError("Use um link http(s), #page/endereco ou #pokemon/numero.")
        if key in ("sprite", "spriteAlt", "brainSprite", "image"):
            if not re.fullmatch(r"(?:\./)?(?:img|images)/[A-Za-z0-9_./ -]+\.(?:png|gif|jpe?g|webp)", value):
                raise ValueError(f"{path}: selecione uma imagem local.")
            if ".." in value.split("/"):
                raise ValueError(f"{path}: caminho inválido.")
        elif key in ("name", "brain", "type") or "/spriteLabels/" in path:
            if re.search(r'[<>"]', value):
                raise ValueError(f"{path}: não use HTML ou aspas neste campo.")
        else:
            SafeHTML(convert_charrefs=True).feed(value)
        if "/types/" in path and value not in TYPES:
            raise ValueError(f"{path}: tipo da geração 3 inválido.")
    elif isinstance(value, (float, int)) and not isinstance(value, bool):
        key = path.rsplit("/", 1)[-1]
        if ("minimum" in schema and value < schema["minimum"]) or ("maximum" in schema and value > schema["maximum"]):
            raise ValueError(f"{path}: valor fora do limite.")
        if key == "pokemonId" and type(value) is not int:
            raise ValueError("Escolha um número inteiro de Pokémon.")
        if key == "id" and (not isinstance(value, int) or not 1 <= value <= 386):
            raise ValueError(f"{path}: número do Pokémon entre 1 e 386.")
        if key == "level" and (not isinstance(value, int) or not 1 <= value <= 100):
            raise ValueError(f"{path}: nível entre 1 e 100.")


def atomic_write(path, raw):
    fd, temp = tempfile.mkstemp(prefix=".editor-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as out:
            out.write(raw)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


class EditorServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, root=ROOT, port=8765, backup_dir=None):
        self.root = Path(root).resolve()
        self.backup_dir = Path(backup_dir).resolve() if backup_dir else self.root.parent / (self.root.name + "-backups") / "editor"
        self.token = secrets.token_urlsafe(32)
        self.snapshots = {}
        self.schemas = {}
        self.baselines = {}
        for name in DOCUMENTS:
            self.baselines[name] = json.loads((self.root / "data" / name).read_text(encoding="utf-8"))
            self.schemas[name] = infer([self.baselines[name]])
        # Arrays vazios herdam o modelo de outra lista do mesmo tipo.
        candidates = {}
        def collect(schema, key=""):
            if "array" in schema["types"] and schema["items"]["types"]:
                candidates.setdefault(key, []).append(schema["items"])
            for k, v in schema.get("properties", {}).items():
                collect(v, k)
            if "items" in schema:
                collect(schema["items"], key)
        for schema in self.schemas.values():
            collect(schema)
        def fill(schema, key=""):
            if "items" in schema and not schema["items"]["types"] and key in candidates:
                schema["items"] = copy.deepcopy(candidates[key][0])
            for k, v in schema.get("properties", {}).items():
                fill(v, k)
            if "items" in schema:
                fill(schema["items"], key)
        for schema in self.schemas.values():
            fill(schema)
        # Modelos versionados preservam os campos mesmo depois de esvaziar uma lista.
        model_path = Path(__file__).with_name("editor") / "schema.json"
        if model_path.is_file():
            self.schemas = json.loads(model_path.read_text(encoding="utf-8"))
        super().__init__(("127.0.0.1", port), EditorHandler)

    def check_document(self, name, data):
        if not isinstance(name, str) or name not in DOCUMENTS:
            raise ValueError("Arquivo fora da lista editável.")
        validate(data, self.schemas[name])
        check_extensions(name, data)
        if name == "guides.json":
            for guide, required in {"weakness": ["calc-type-1", "calc-type-2", "calc-result"],
                                    "natures": ["natures-table-body"]}.items():
                for element_id in required:
                    if not re.search(r'id=["\']' + element_id + r'["\']', data[guide]["content"]):
                        raise ValueError(f"Preserve o componente interativo {element_id} no guia {guide}.")


class EditorHandler(BaseHTTPRequestHandler):
    server_version = "WikiLocalEditor/2.2"

    def log_message(self, fmt, *args):
        # Nao registrar token, corpo dos documentos ou URLs privadas de previa.
        if args and str(args[0]).startswith("GET"):
            return

    def respond(self, code, data, content_type="application/json; charset=utf-8"):
        raw = encode(data) if not isinstance(data, bytes) else data
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        # A previa usa os scripts legados, mas nunca registra service workers.
        self.send_header("Content-Security-Policy", "worker-src 'none'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'")
        self.end_headers()
        self.wfile.write(raw)

    def allowed(self, api=False):
        origin = f"http://127.0.0.1:{self.server.server_port}"
        if self.headers.get("Host") != origin.removeprefix("http://"):
            self.respond(403, {"error": "Acesso permitido somente pelo endereço local do editor."})
            return False
        if self.headers.get("Origin", origin) != origin or self.headers.get("Sec-Fetch-Site") == "cross-site":
            self.respond(403, {"error": "Origem não autorizada."})
            return False
        if api and not hmac.compare_digest(self.headers.get("X-Editor-Token", ""), self.server.token):
            self.respond(403, {"error": "Sessão inválida. Abra o endereço exibido ao iniciar o editor."})
            return False
        return True

    def document(self, name):
        if not isinstance(name, str) or name not in DOCUMENTS:
            raise ValueError("Arquivo fora da lista editável.")
        path = (self.server.root / "data" / name).resolve()
        if not path.is_relative_to(self.server.root / "data"):
            raise ValueError("Caminho não autorizado.")
        return path

    def backup_file(self, name, backup_id):
        self.document(name)
        pattern = r"\d{8}-\d{6}-\d{6}-" + re.escape(name.replace("/", "-"))
        if not isinstance(backup_id, str) or not re.fullmatch(pattern, backup_id):
            raise ValueError("Backup inválido para este documento.")
        folder = self.server.backup_dir.resolve()
        candidate = folder / backup_id
        if candidate.is_symlink() or not candidate.resolve().is_relative_to(folder):
            raise ValueError("Caminho de backup não autorizado.")
        if not candidate.is_file() or candidate.stat().st_size > LIMIT:
            raise ValueError("Backup indisponível ou muito grande.")
        return candidate

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if not self.allowed(path.startswith("/api/")):
            return
        try:
            if path == "/api/workspace":
                return self.respond(200, git_status(self.server.root))
            if path == "/api/media":
                return self.respond(200, media_library(self.server.root))
            if path.startswith("/api/backups/"):
                name = path[len("/api/backups/"):]
                self.document(name)
                backups = []
                for candidate in sorted(self.server.backup_dir.glob("*.json"), reverse=True):
                    try:
                        file = self.backup_file(name, candidate.name)
                        stamp = datetime.strptime(candidate.name[:22], "%Y%m%d-%H%M%S-%f")
                    except (ValueError, OSError):
                        continue
                    backups.append({"id": file.name, "date": stamp.isoformat(), "size": file.stat().st_size})
                return self.respond(200, {"backups": backups})
            if path == "/api/catalog":
                assets = [p.relative_to(self.server.root).as_posix()
                          for folder in ("img/trainers", "img/items", "img/badges", "img/uploads")
                          for p in sorted((self.server.root / folder).glob("*.png"))]
                return self.respond(200, {"documents": DOCUMENTS, "assets": assets,
                    "pokemon": json.loads((self.server.root / "data/pokedex.json").read_text(encoding="utf-8")),
                    "backupDir": str(self.server.backup_dir), "project": str(self.server.root)})
            if path.startswith("/api/document/"):
                name = path[len("/api/document/"):]
                raw = self.document(name).read_bytes()
                return self.respond(200, {"data": json.loads(raw), "revision": digest(raw),
                                         "schema": self.server.schemas[name]})
            if path == "/":
                return self.respond(200, b'<a href="/editor/">Abrir editor local</a>', "text/html; charset=utf-8")
            if path.startswith("/editor/"):
                leaf = path[len("/editor/"):] or "index.html"
                if leaf not in ("index.html", "editor.js", "editor.css", "theme.js", "dark.css", "media.js", "review.js", "review.css", "workspace.js", "workspace.css"):
                    return self.respond(404, {"error": "Não encontrado."})
                return self.serve_file(self.server.root / "tools/editor" / leaf)
            if path.startswith("/preview/"):
                parts = path.split("/", 3)
                if len(parts) != 4 or parts[2] not in self.server.snapshots:
                    return self.respond(404, {"error": "Prévia expirada. Gere outra prévia."})
                snapshot = self.server.snapshots[parts[2]]
                relative = parts[3] or "index.html"
                if relative == "data/" + snapshot["name"]:
                    return self.respond(200, snapshot["data"])
                return self.serve_site(relative, snapshot)
            if path.startswith(("/img/", "/images/", "/favicons/", "/css/", "/audio/", "/fonts/", "/vendor/")):
                return self.serve_site(path[1:])
            return self.respond(404, {"error": "Não encontrado."})
        except (ValueError, OSError) as error:
            self.respond(400, {"error": str(error)})

    def serve_file(self, path):
        if not path.is_file():
            return self.respond(404, {"error": "Arquivo não encontrado."})
        content_type = {".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json"}.get(path.suffix, mimetypes.guess_type(str(path))[0] or "application/octet-stream")
        self.respond(200, path.read_bytes(), content_type + ("; charset=utf-8" if path.suffix in (".js", ".css", ".html", ".json") else ""))

    def serve_site(self, relative, snapshot=None):
        if "\\" in relative or any(p.startswith(".") or p == ".." for p in relative.split("/")):
            return self.respond(403, {"error": "Caminho não autorizado."})
        if relative != "index.html" and relative != "manifest.json" and relative.split("/")[0] not in ("css", "js", "data", "img", "images", "favicons", "audio", "fonts", "vendor"):
            return self.respond(404, {"error": "Arquivo não disponível na prévia."})
        target = (self.server.root / relative).resolve()
        if not target.is_relative_to(self.server.root):
            return self.respond(403, {"error": "Caminho não autorizado."})
        if relative == "index.html" and snapshot:
            html = target.read_text(encoding="utf-8")
            # Desativa apenas a instalacao da PWA nesta resposta local; fonte intacta.
            html = html.replace("if ('serviceWorker' in navigator)", "if (false)")
            html = re.sub(r'<script defer src="https://cdnjs[^"]+"></script>', "", html)
            context = json.dumps(snapshot["context"]).replace("<", "\\u003c")
            bootstrap = """
<script>
const editorContext = CONTEXT;
localStorage.setItem('wiki-version-group', editorContext.version || 'emerald');
localStorage.setItem('wiki-lang', editorContext.lang || 'pt');
document.addEventListener('DOMContentLoaded', () => {
    const app = window.app;
    if (!app) return;
    app.state.versionGroup = editorContext.version || 'emerald';
    if (editorContext.gymTab) app.state.gymTab = editorContext.gymTab;
    if (editorContext.guideTab) app.state.guideTab = editorContext.guideTab;
    if (editorContext.tmTab) app.state.tmTab = editorContext.tmTab;
    for (const [selector, tab] of [
        ['.frontier-main-tab', editorContext.frontierTab],
        ['.extras-main-tab', editorContext.extrasTab],
        ['.btn-guide-tab', editorContext.guideTab],
        ['.btn-gym-tab', editorContext.gymTab]]) {
        if (tab) document.querySelectorAll(selector).forEach(b => {
            const active = b.dataset.tab === tab;
            b.classList.toggle('active', active);
            if (selector === '.btn-gym-tab' || selector === '.btn-guide-tab') {
                b.style.background = active ? 'var(--primary-surface)' : '';
                b.style.color = active ? 'var(--primary-on)' : '';
            }
        });
    }
});
</script>
""".replace("CONTEXT", context)
            html = html.replace("</head>", bootstrap + "</head>")
            return self.respond(200, html.encode("utf-8"), "text/html; charset=utf-8")
        return self.serve_file(target)

    def do_POST(self):
        if not self.allowed(api=True):
            return
        try:
            if self.headers.get_content_type() != "application/json":
                return self.respond(415, {"error": "Envie JSON."})
            size = int(self.headers.get("Content-Length", "0"))
            route = urlsplit(self.path).path
            maximum = 12 * 1024 * 1024 if route == "/api/upload" else LIMIT
            if size < 1 or size > maximum:
                return self.respond(413, {"error": "Conteúdo muito grande ou vazio."})
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError("Envie um objeto JSON.")
            if route == "/api/upload":
                with LOCK:
                    image = store_image(self.server.root, body.get("name"), body.get("png"))
                return self.respond(200, image)
            if route == "/api/backup":
                name = body.get("name")
                with LOCK:
                    raw = self.backup_file(name, body.get("id")).read_bytes()
                data = json.loads(raw)
                self.server.check_document(name, data)
                return self.respond(200, {"data": data})
            name, data = body.get("name"), body.get("data")
            self.document(name)
            self.server.check_document(name, data)
            path = urlsplit(self.path).path
            if path == "/api/preview":
                context = body.get("context", {})
                if not isinstance(context, dict):
                    raise ValueError("Contexto de prévia inválido.")
                if name == "pages.json":
                    data = copy.deepcopy(data)
                    template = context.get("templateIndex")
                    if type(template) is int and 0 <= template < len(data["templates"]):
                        card = copy.deepcopy(data["templates"][template])
                        data["pages"] = []
                        data["pages"].append({"slug":"modelo-preview","title":card["title"],
                            "description":"Prévia do modelo de card","menuLabel":"Modelo",
                            "visible":True,"versions":[],"cards":[card],"en":{}})
                    for page in data["pages"]:
                        if page["slug"] == context.get("pageSlug"):
                            page["visible"] = True
                snapshot_id = secrets.token_urlsafe(18)
                with LOCK:
                    if len(self.server.snapshots) >= 25:
                        self.server.snapshots.pop(next(iter(self.server.snapshots)))
                    self.server.snapshots[snapshot_id] = {"name": name, "data": data, "context": context}
                return self.respond(200, {"url": f"/preview/{snapshot_id}/index.html"})
            if path != "/api/save":
                return self.respond(404, {"error": "Operação inexistente."})
            with LOCK:
                target = self.document(name)
                original = target.read_bytes()
                if body.get("revision") != digest(original):
                    return self.respond(409, {"error": "O arquivo mudou fora deste editor. Exporte o rascunho e reabra o arquivo antes de salvar."})
                if json.loads(original) == data:
                    return self.respond(200, {"revision": digest(original), "unchanged": True})
                raw = encode(data)
                self.server.backup_dir.mkdir(parents=True, exist_ok=True)
                stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
                backup = self.server.backup_dir / (stamp + "-" + name.replace("/", "-"))
                with backup.open("xb") as out:
                    out.write(original)
                if backup.read_bytes() != original:
                    raise OSError("Falha na verificação do backup; nada foi salvo.")
                atomic_write(target, raw)
            self.respond(200, {"revision": digest(raw), "backup": str(backup)})
        except (ValueError, TypeError, KeyError, OSError, RecursionError) as error:
            self.respond(400, {"error": str(error)})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--open", action="store_true", help="Abrir o editor no navegador")
    args = parser.parse_args()
    try:
        server = EditorServer(port=args.port)
    except OSError as error:
        raise SystemExit(f"Não foi possível iniciar: {error}\nTente --port 8766.")
    url = f"http://127.0.0.1:{server.server_port}/editor/#{server.token}"
    print(f"\nWikiGen3 · Editor local\n{url}\n\nBackups: {server.backup_dir}\nCtrl+C para encerrar. Salvar não publica no GitHub.\n", flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
