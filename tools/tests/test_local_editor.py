"""Regressoes do editor: apenas fixtures temporarias, nunca os dados reais."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from local_editor import EditorServer, DOCUMENTS, ROOT, digest


class EditorTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wiki-editor-unit-")
        self.root = Path(self.temp.name).resolve()
        assert self.root.is_relative_to(Path(tempfile.gettempdir()).resolve())
        shutil.copytree(ROOT / "data", self.root / "data")
        self.server = EditorServer(self.root, port=0, backup_dir=self.root / "backups")
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, route, body=None, headers=None):
        url = f"http://127.0.0.1:{self.server.server_port}" + route
        head = {"X-Editor-Token": self.server.token}
        if body is not None:
            head["Content-Type"] = "application/json"
        if headers:
            head.update(headers)
        req = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=head)
        try:
            with urlopen(req) as response:
                return response.status, response.read()
        except HTTPError as error:
            return error.code, error.read()

    def payload(self, name="key-items.json"):
        raw = (self.root / "data" / name).read_bytes()
        return {"name": name, "data": json.loads(raw), "revision": digest(raw)}

    def test_all_existing_documents_validate(self):
        for name in DOCUMENTS:
            self.server.check_document(name, self.payload(name)["data"])

    def test_auth_origin_host_and_allowlist(self):
        for route, headers in [
            ("/api/catalog", {"X-Editor-Token": ""}),
            ("/api/catalog", {"Origin": "https://malicioso.example"}),
            ("/api/catalog", {"Host": "malicioso.example"}),
            ("/api/catalog", {"Sec-Fetch-Site": "cross-site"}),
        ]:
            self.assertEqual(self.request(route, headers=headers)[0], 403)
        for route in ("/api/workspace", "/api/media"):
            self.assertEqual(self.request(route, headers={"X-Editor-Token":""})[0], 403)
        self.assertEqual(self.request("/api/document/../index.html")[0], 400)
        self.assertEqual(self.request("/.git/config")[0], 404)
        self.assertEqual(self.request("/api/save", {"name":"../index.html", "data":{}})[0], 400)

    def test_save_backup_conflict_and_noop(self):
        body = self.payload()
        file = self.root / "data/key-items.json"
        before = file.read_bytes()
        self.assertEqual(self.request("/api/save", body)[0], 200)
        self.assertFalse((self.root / "backups").exists())
        body["data"]["hoenn"][0]["items"][0]["desc"] = "Teste: descrição com acentos."
        code, raw = self.request("/api/save", body)
        self.assertEqual(code, 200, raw)
        response = json.loads(raw)
        self.assertEqual(Path(response["backup"]).read_bytes(), before)
        self.assertEqual(json.loads(file.read_bytes()), body["data"])
        self.assertEqual(response["revision"], digest(file.read_bytes()))
        self.assertEqual(self.request("/api/save", body)[0], 409)

    def test_backup_history_restore_and_conflict(self):
        body = self.payload()
        original = copy.deepcopy(body["data"])
        body["data"]["hoenn"][0]["category"] = "Editado"
        saved = json.loads(self.request("/api/save", body)[1])
        history = json.loads(self.request("/api/backups/key-items.json")[1])["backups"]
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["id"], Path(saved["backup"]).name)
        self.assertEqual(json.loads(self.request("/api/backups/gyms.json")[1])["backups"], [])
        code, raw = self.request("/api/backup", {"name":body["name"], "id":history[0]["id"]})
        self.assertEqual(code, 200, raw)
        recovered = json.loads(raw)["data"]
        self.assertEqual(recovered, original)
        self.assertEqual(self.payload()["data"], body["data"])  # Reading never restores.
        restore = self.payload()
        restore["data"] = recovered
        self.assertEqual(self.request("/api/save", restore)[0], 200)
        self.assertEqual(self.payload()["data"], original)
        self.assertEqual(len(list(self.server.backup_dir.glob("*.json"))), 2)
        self.assertEqual(self.request("/api/save", restore)[0], 409)
        self.assertTrue(any(json.loads(p.read_bytes()) == body["data"] for p in self.server.backup_dir.glob("*.json")))

    def test_backup_history_rejects_wrong_document_paths_and_invalid_data(self):
        body = self.payload()
        body["data"]["hoenn"][0]["category"] = "Backup"
        backup = Path(json.loads(self.request("/api/save", body)[1])["backup"])
        for name, identifier in [("gyms.json", backup.name), ("key-items.json", "../"+backup.name),
                                 ("../private.json", backup.name), ("key-items.json", "unknown.json")]:
            self.assertEqual(self.request("/api/backup", {"name":name,"id":identifier})[0], 400)
        self.assertEqual(self.request("/api/backups/key-items.json", headers={"X-Editor-Token":""})[0], 403)
        self.assertEqual(self.request("/api/backup", {"name":body["name"],"id":backup.name},
                                      headers={"Origin":"https://example.com"})[0], 403)
        backup.write_text('{"bad":true}', encoding="utf-8")
        self.assertEqual(self.request("/api/backup", {"name":body["name"],"id":backup.name})[0], 400)
        backup.write_bytes(b"x" * 2_000_001)
        self.assertEqual(self.request("/api/backup", {"name":body["name"],"id":backup.name})[0], 400)

    def test_preview_does_not_write(self):
        body = self.payload()
        before = (self.root / "data/key-items.json").read_bytes()
        body["data"]["hoenn"][0]["items"][0]["desc"] = "Somente na prévia"
        code, raw = self.request("/api/preview", body)
        self.assertEqual(code, 200, raw)
        prefix = json.loads(raw)["url"].removesuffix("index.html")
        code, preview = self.request(prefix+"data/key-items.json?v=teste")
        self.assertEqual(code, 200)
        self.assertEqual(json.loads(preview), body["data"])
        self.assertEqual((self.root / "data/key-items.json").read_bytes(), before)
        self.assertEqual(self.request(prefix+"../.git/config")[0], 403)
        self.assertEqual(self.request(prefix+"sw.js")[0], 404)

    def test_invalid_data_never_writes(self):
        payload = self.payload()
        before = (self.root / "data/key-items.json").read_bytes()
        cases = []
        bad = copy.deepcopy(payload)
        bad["data"]["hoenn"][0]["items"][0]["desc"] = '<img src="img/a.png" onerror="alert(1)">'
        cases.append(bad)
        bad = copy.deepcopy(payload)
        bad["data"]["hoenn"][0]["items"][0]["name"] = '" onerror="alert(1)'
        cases.append(bad)
        bad = copy.deepcopy(payload)
        del bad["data"]["hoenn"][0]["items"]
        cases.append(bad)
        for body in cases:
            self.assertEqual(self.request("/api/save", body)[0], 400)
            self.assertEqual((self.root / "data/key-items.json").read_bytes(), before)
        self.assertEqual(self.request("/api/save", [1,2])[0], 400)

    def test_guides_keep_interactive_components(self):
        body = self.payload("guides.json")
        body["data"]["weakness"]["content"] = "<p>Sem calculadora</p>"
        self.assertEqual(self.request("/api/save", body)[0], 400)

    def test_numeric_limits_and_gen3_types(self):
        for key, value in [("id", 999), ("level", 101), ("types", ["fairy"])]:
            body = self.payload("gyms.json")
            body["data"]["emerald"]["gyms"][0]["silverTeam"][0][key] = value
            self.assertEqual(self.request("/api/save", body)[0], 400)

    def test_blue_has_all_frlg_battle_variants(self):
        body = self.payload("gyms.json")
        blue = body["data"]["firered-leafgreen"]["rivals"][0]
        battles = blue["battles"]
        self.assertEqual(len(battles), 9)
        self.assertTrue(all(len(battle["variants"]) == 3 for battle in battles))
        self.assertTrue(all(
            {variant["playerStarter"] for variant in battle["variants"]}
            == {"Bulbasaur", "Charmander", "Squirtle"}
            for battle in battles
        ))
        self.assertEqual([len(variant["team"]) for variant in battles[-1]["variants"]], [6, 6, 6])
        self.assertEqual(battles[-1]["battleItems"], [{"name": "Full Restore", "quantity": 4}])
        self.assertTrue(all(
            any(pokemon["item"] == "Sitrus Berry" for pokemon in battle["variants"][0]["team"])
            for battle in battles[-2:]
        ))
        self.server.check_document("gyms.json", body["data"])

    def test_empty_lists_keep_models_after_restart(self):
        body = self.payload()
        body["data"]["hoenn"] = []
        self.assertEqual(self.request("/api/save", body)[0], 200)
        other = EditorServer(self.root, port=0, backup_dir=self.root / "backups")
        try:
            item = other.schemas["key-items.json"]["properties"]["hoenn"]["items"]
            self.assertIn("items", item["properties"])
            self.assertIn("name", item["properties"]["items"]["items"]["properties"])
        finally:
            other.server_close()

    def test_parallel_saves_reject_one_stale_revision(self):
        from concurrent.futures import ThreadPoolExecutor
        one = self.payload()
        two = copy.deepcopy(one)
        one["data"]["hoenn"][0]["category"] = "Primeira aba"
        two["data"]["hoenn"][0]["category"] = "Segunda aba"
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda body: self.request("/api/save", body)[0], [one, two]))
        self.assertEqual(sorted(results), [200, 409])
        self.assertEqual(len(list((self.root / "backups").glob("*.json"))), 1)

    def test_import_image_and_reject_invalid_files(self):
        import base64, struct, zlib
        def chunk(kind, body):
            return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind+body) & 0xffffffff)
        png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(b"\0\x20\x80\x40\xff")) + chunk(b"IEND", b"")
        body = {"name":"../../nova imagem.png","png":base64.b64encode(png).decode()}
        code, raw = self.request("/api/upload", body)
        self.assertEqual(code, 200, raw)
        response = json.loads(raw)
        path = (self.root / response["path"]).resolve()
        self.assertTrue(path.is_relative_to(self.root / "img/uploads"))
        self.assertEqual(path.read_bytes(), png)
        self.assertEqual(json.loads(self.request("/api/upload",body)[1])["path"], response["path"])
        body["png"] = base64.b64encode(b"<svg onload='alert(1)'></svg>").decode()
        self.assertEqual(self.request("/api/upload",body)[0], 400)
        body["png"] = base64.b64encode(png[:-1]+b"X").decode()
        self.assertEqual(self.request("/api/upload",body)[0], 400)
        self.assertEqual(self.request("/api/upload",body,headers={"X-Editor-Token":""})[0],403)
        body = {"name":"falha.png","png":base64.b64encode(png).decode()}
        with patch("editor_extensions.os.replace",side_effect=OSError("Falha simulada")):
            self.assertEqual(self.request("/api/upload",body)[0],400)
        self.assertEqual(len(list((self.root/"img/uploads").glob("*.png"))),1)
        self.assertFalse(list((self.root/"img/uploads").glob(".upload-*.tmp")))

    def test_custom_pages_and_template_preview(self):
        body = self.payload("pages.json")
        card = body["data"]["templates"][0]
        page = {"slug":"guia-teste","title":"Guia de teste","menuLabel":"Meu guia",
                "description":"Introdução","visible":True,"versions":[],"cards":[card],
                "en":{"title":"","menuLabel":"","description":""}}
        body["data"]["pages"].append(page)
        self.assertEqual(self.request("/api/save",body)[0],200)
        duplicate = self.payload("pages.json")
        duplicate["data"]["pages"].append(copy.deepcopy(page))
        self.assertEqual(self.request("/api/save",duplicate)[0],400)
        body = self.payload("pages.json")
        body["context"] = {"templateIndex":0}
        code,raw = self.request("/api/preview",body)
        self.assertEqual(code,200)
        prefix=json.loads(raw)["url"].removesuffix("index.html")
        snapshot=json.loads(self.request(prefix+"data/pages.json")[1])
        self.assertEqual(snapshot["pages"][-1]["slug"],"modelo-preview")
        self.assertEqual(len(json.loads((self.root/"data/pages.json").read_bytes())["pages"]),1)

    def test_pokemon_corrections_do_not_change_generated_files(self):
        body = self.payload("pokemon-overrides.json")
        original = (self.root/"data/pokemon/1.json").read_bytes()
        body["data"]["corrections"] = [{"pokemonId":1,"changes":{"stats":{"hp":80}},
            "translations":{"pt":{"description":"Descrição corrigida","category":""},
                            "en":{"description":"","category":""}}}]
        self.assertEqual(self.request("/api/save",body)[0],200)
        self.assertEqual((self.root/"data/pokemon/1.json").read_bytes(),original)
        body=self.payload("pokemon-overrides.json")
        body["data"]["corrections"][0]["changes"]["tipos"]=["fairy"]
        self.assertEqual(self.request("/api/save",body)[0],400)
        body=self.payload("pokemon-overrides.json")
        body["data"]["corrections"].append(copy.deepcopy(body["data"]["corrections"][0]))
        self.assertEqual(self.request("/api/save",body)[0],400)

    def test_write_failure_preserves_original(self):
        body = self.payload()
        target = self.root / "data/key-items.json"
        before = target.read_bytes()
        body["data"]["hoenn"][0]["items"][0]["desc"] = "Falha simulada"
        with patch("local_editor.os.replace", side_effect=OSError("Disco indisponível")):
            self.assertEqual(self.request("/api/save", body)[0], 400)
        self.assertEqual(target.read_bytes(), before)
        self.assertEqual(len(list((self.root / "backups").glob("*.json"))), 1)
        self.assertFalse(list(target.parent.glob(".editor-*.tmp")))


if __name__ == "__main__":
    unittest.main()
