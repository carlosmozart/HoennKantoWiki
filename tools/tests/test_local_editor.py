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
