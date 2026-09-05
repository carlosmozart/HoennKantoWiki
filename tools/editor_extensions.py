"""Validacao de imagens, paginas e correcoes editoriais. Somente biblioteca padrao."""
import base64
import binascii
import hashlib
import os
import tempfile
from pathlib import Path
import re
import struct
import unicodedata
import zlib

MAX_UPLOAD = 8 * 1024 * 1024
VERSIONS = {"emerald", "ruby-sapphire", "firered-leafgreen"}
TYPES = set("normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel".split())


def store_image(root, name, payload):
    if not isinstance(name, str) or not isinstance(payload, str):
        raise ValueError("Imagem inválida.")
    try:
        raw = base64.b64decode(payload, validate=True)
    except (ValueError, binascii.Error):
        raise ValueError("Imagem inválida.") from None
    if len(raw) > MAX_UPLOAD or not raw.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Envie um PNG de até 8 MB.")
    position, data, seen, width, height, channels = 8, [], [], 0, 0, 0
    while position < len(raw):
        if position + 12 > len(raw):
            raise ValueError("PNG incompleto.")
        size = struct.unpack(">I", raw[position:position+4])[0]
        kind = raw[position+4:position+8]
        body = raw[position+8:position+8+size]
        end = position + 12 + size
        if end > len(raw) or kind not in (b"IHDR",b"IDAT",b"IEND",b"sRGB",b"gAMA",b"cHRM",b"pHYs"):
            raise ValueError("Estrutura PNG não permitida.")
        crc = struct.unpack(">I", raw[end-4:end])[0]
        if zlib.crc32(kind+body) & 0xffffffff != crc:
            raise ValueError("PNG corrompido.")
        if kind == b"IHDR":
            if seen or size != 13:
                raise ValueError("Cabeçalho PNG inválido.")
            width,height,depth,color,compression,filtering,interlace = struct.unpack(">IIBBBBB",body)
            if not (0 < width <= 4096 and 0 < height <= 4096 and width*height <= 8_000_000):
                raise ValueError("Dimensões da imagem fora do limite.")
            if depth != 8 or color not in (2,6) or compression or filtering or interlace:
                raise ValueError("O navegador deve converter a imagem em PNG RGB/RGBA.")
            channels = 3 if color == 2 else 4
        if not seen and kind != b"IHDR":
            raise ValueError("Cabeçalho PNG ausente.")
        if kind == b"IDAT":
            data.append(body)
        if kind == b"IEND":
            if size or end != len(raw):
                raise ValueError("Final PNG inválido.")
        seen.append(kind)
        position = end
    if not seen or seen[-1] != b"IEND" or not data:
        raise ValueError("PNG incompleto.")
    expected = height * (1 + width*channels)
    try:
        decoder = zlib.decompressobj()
        pixels = decoder.decompress(b"".join(data), expected+1)
        if len(pixels) != expected or not decoder.eof or decoder.unused_data:
            raise ValueError("Pixels PNG inválidos.")
        if any(pixels[row*(1+width*channels)] > 4 for row in range(height)):
            raise ValueError("Filtro PNG inválido.")
    except zlib.error:
        raise ValueError("PNG corrompido.") from None
    stem = unicodedata.normalize("NFKD", Path(name).stem).encode("ascii","ignore").decode().lower()
    stem = re.sub(r"[^a-z0-9]+","-",stem).strip("-")[:50] or "imagem"
    folder = (root/"img/uploads").resolve()
    if not folder.is_relative_to(root.resolve()):
        raise ValueError("Pasta de imagens fora do projeto.")
    folder.mkdir(parents=True,exist_ok=True)
    target = folder / (stem+"-"+hashlib.sha256(raw).hexdigest()[:16]+".png")
    if target.exists():
        if target.is_symlink() or target.read_bytes() != raw:
            raise ValueError("Já existe uma imagem diferente com esse nome.")
    else:
        # Publicar somente depois de gravar a imagem completa no mesmo volume.
        fd, temporary = tempfile.mkstemp(prefix=".upload-",suffix=".tmp",dir=folder)
        try:
            with os.fdopen(fd,"wb") as out:
                out.write(raw)
                out.flush()
                os.fsync(out.fileno())
            if target.exists():
                if target.is_symlink() or target.read_bytes() != raw:
                    raise ValueError("Conflito ao importar a imagem.")
            else:
                os.replace(temporary,target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    return {"path":target.relative_to(root).as_posix(),"width":width,"height":height}


def check_extensions(name, data):
    if name == "pages.json":
        slugs = {}
        for page in data["pages"]:
            slug = page["slug"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or len(slug) > 70:
                raise ValueError("Use um endereço de página como 'meu-guia' (letras minúsculas, números e hífens).")
            if not page["title"].strip():
                raise ValueError("Preencha o título da página.")
            if not set(page["versions"]).issubset(VERSIONS):
                raise ValueError("Versão de jogo inválida.")
            coverage = set(page["versions"]) or set(VERSIONS)
            if coverage & slugs.get(slug, set()):
                raise ValueError("O mesmo endereço não pode aparecer duas vezes na mesma versão de jogo.")
            slugs.setdefault(slug, set()).update(coverage)
            tab_ids = set()
            if not page["tabs"]:
                raise ValueError("Mantenha pelo menos uma aba em cada página.")
            for tab in page["tabs"]:
                tab_id = tab["tabId"]
                if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", tab_id) or tab_id in tab_ids:
                    raise ValueError("Cada aba deve ter um identificador único, como 'dicas-avancadas'.")
                if not tab["label"].strip():
                    raise ValueError("Preencha o nome de todas as abas.")
                tab_ids.add(tab_id)

        page_slugs = set(slugs)
        menu_ids = set()

        def check_menu_entry(entry, sibling_ids):
            entry_id = entry["menuId"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", entry_id) or entry_id in sibling_ids:
                raise ValueError("Use identificadores únicos nos menus e submenus.")
            sibling_ids.add(entry_id)
            if not entry["label"].strip():
                raise ValueError("Preencha o nome de todos os itens de navegação.")
            if not set(entry["versions"]).issubset(VERSIONS):
                raise ValueError("Versão de jogo inválida em um item de navegação.")
            target = entry["pageSlug"]
            if target and target not in page_slugs:
                raise ValueError(f"A página vinculada '{target}' não existe.")
            child_ids = set()
            for child in entry.get("children", []):
                check_menu_entry(child, child_ids)

        for menu in data["navigation"]:
            menu_id = menu["menuId"]
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", menu_id) or menu_id in menu_ids:
                raise ValueError("Use um identificador único para cada menu.")
            menu_ids.add(menu_id)
            if not menu["label"].strip():
                raise ValueError("Preencha o nome de todos os menus.")
            if not set(menu["versions"]).issubset(VERSIONS):
                raise ValueError("Versão de jogo inválida em um menu.")
            sibling_ids = set()
            for entry in menu["entries"]:
                check_menu_entry(entry, sibling_ids)
    if name == "pokemon-overrides.json":
        ids = set()
        for correction in data["corrections"]:
            poke_id = correction["pokemonId"]
            if type(poke_id) is not int or not 1 <= poke_id <= 386 or poke_id in ids:
                raise ValueError("Use apenas uma correção por Pokémon (1 a 386).")
            ids.add(poke_id)
            changes = correction["changes"]
            if "tipos" in changes and (not 1 <= len(changes["tipos"]) <= 2 or not set(changes["tipos"]).issubset(TYPES)):
                raise ValueError("Escolha um ou dois tipos da geração 3.")
            if "stats" in changes and any(type(v) is not int or not 1 <= v <= 255 for v in changes["stats"].values()):
                raise ValueError("Os status base devem ser inteiros entre 1 e 255.")
            if "nome" in changes and not re.fullmatch(r"[a-z0-9-]+",changes["nome"]):
                raise ValueError("Use o nome identificador do Pokémon em minúsculas, sem espaços.")
            if "habilidades" in changes and not changes["habilidades"]:
                raise ValueError("Mantenha pelo menos uma habilidade.")
            for key in ("altura","peso"):
                if key in changes and (type(changes[key]) is not int or changes[key] < 1):
                    raise ValueError("Altura e peso devem ser inteiros positivos (decímetros/hectogramas).")
