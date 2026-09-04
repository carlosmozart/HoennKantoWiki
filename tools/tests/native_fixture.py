"""Serve the generated Android web assets locally for browser verification."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sys
import threading

root=Path(__file__).resolve().parents[2]/"dist/android-web"
if not (root/"native.js").is_file(): raise SystemExit("Run npm run android:web first.")
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(("127.0.0.1",0),partial(Handler,directory=str(root)))
thread=threading.Thread(target=server.serve_forever,daemon=True)
thread.start()
print(json.dumps({"url":f"http://127.0.0.1:{server.server_port}/"}),flush=True)
try: sys.stdin.read()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
