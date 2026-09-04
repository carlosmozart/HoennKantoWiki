"""Workspace panels use isolated repositories; no remote access."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editor_workspace import git_status, media_library

class WorkspaceTest(unittest.TestCase):
    def test_git_changes_rename_and_untracked(self):
        with tempfile.TemporaryDirectory(prefix="wiki-git-") as folder:
            root=Path(folder)
            def git(*args):
                return subprocess.run(["git","-C",folder,*args],check=True,capture_output=True)
            git("init","-b","main")
            (root/"first.json").write_text("{}")
            git("add",".")
            git("-c","user.name=Editor test","-c","user.email=test@example.invalid","commit","-m","fixture")
            git("mv","first.json","novo nome.json")
            (root/"untracked.json").write_text("{}")
            status=git_status(root)
            self.assertTrue(status["available"])
            self.assertEqual(status["branch"],"main")
            self.assertIsNone(status["upstream"])
            paths={file["path"]:file for file in status["files"]}
            self.assertEqual(paths["novo nome.json"]["previousPath"],"first.json")
            self.assertEqual(paths["untracked.json"]["status"],"??")
            git("update-ref","refs/remotes/origin/main","HEAD")
            git("config","branch.main.remote","origin")
            git("config","branch.main.merge","refs/heads/main")
            git("config","remote.origin.fetch","+refs/heads/*:refs/remotes/origin/*")
            self.assertEqual(git_status(root)["ahead"],0)
            self.assertEqual(git_status(root)["behind"],0)
    def test_missing_git_repository(self):
        with tempfile.TemporaryDirectory(prefix="wiki-git-") as folder:
            self.assertFalse(git_status(Path(folder))["available"])
    def test_media_references_and_unreferenced_uploads(self):
        with tempfile.TemporaryDirectory(prefix="wiki-media-") as folder:
            root=Path(folder)
            (root/"img/uploads").mkdir(parents=True)
            (root/"data").mkdir()
            (root/"index.html").write_text('<img src="img/uploads/used.png">')
            (root/"manifest.json").write_text("{}")
            for name in ("used","unused"): (root/f"img/uploads/{name}.png").write_bytes(b"image")
            (root/"data/pages.json").write_text(json.dumps({"cards":[{"image":"./img/uploads/used.png"}]}))
            data=media_library(root)
            self.assertEqual(data["warnings"],[])
            assets={a["path"]:a for a in data["assets"]}
            self.assertEqual(len(assets["img/uploads/used.png"]["references"]),2)
            self.assertEqual(assets["img/uploads/unused.png"]["references"],[])
            self.assertTrue(assets["img/uploads/unused.png"]["uploaded"])

if __name__=="__main__": unittest.main()
