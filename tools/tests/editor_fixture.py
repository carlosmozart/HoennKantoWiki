"""Servidor isolado para o teste de navegador; encerra quando stdin fecha."""
import json
from pathlib import Path
import shutil
import sys
import tempfile
import threading
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from local_editor import EditorServer, ROOT

with tempfile.TemporaryDirectory(prefix="wiki-editor-browser-") as temp:
    root=Path(temp).resolve()
    assert root.is_relative_to(Path(tempfile.gettempdir()).resolve())
    for folder in ("data","js","css","img","images","favicons","tools/editor"):
        shutil.copytree(ROOT/folder,root/folder)
    for name in ("index.html","manifest.json"):
        shutil.copy2(ROOT/name,root/name)
    server=EditorServer(root,port=0,backup_dir=root/"backups")
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    print(json.dumps({"url":f"http://127.0.0.1:{server.server_port}/editor/#{server.token}","root":str(root)}),flush=True)
    try:
        sys.stdin.read()
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
