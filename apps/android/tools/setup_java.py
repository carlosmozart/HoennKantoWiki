"""Install a project-local Temurin JDK 21 for the Android Gradle wrapper."""
from pathlib import Path
from urllib.request import urlopen, Request
import hashlib
import json
import zipfile

APP_ROOT=Path(__file__).resolve().parents[1]
def setup():
    target=APP_ROOT/".local/toolchains"
    target.mkdir(parents=True,exist_ok=True)
    url="https://api.github.com/repos/adoptium/temurin21-binaries/releases/latest"
    headers={"User-Agent":"HoennKantoWiki-build/1.0"}
    with urlopen(Request(url,headers=headers),timeout=30) as response: release=json.load(response)
    asset=next(a for a in release["assets"] if a["name"].startswith("OpenJDK21U-jdk_x64_windows_hotspot_") and a["name"].endswith(".zip"))
    checksum=next(a for a in release["assets"] if a["name"]==asset["name"]+".sha256.txt")
    with urlopen(Request(checksum["browser_download_url"],headers=headers),timeout=30) as response: sha=response.read().decode().split()[0]
    package={"link":asset["browser_download_url"],"checksum":sha}
    archive=target/"jdk21.zip"
    print("Downloading Temurin JDK 21",flush=True)
    with urlopen(Request(package["link"],headers={"User-Agent":"HoennKantoWiki-build/1.0"}),timeout=60) as response, archive.open("wb") as out:
        while chunk:=response.read(1024*1024): out.write(chunk)
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=package["checksum"]: raise ValueError("JDK checksum mismatch.")
    with zipfile.ZipFile(archive) as zipped:
        for name in zipped.namelist():
            if not (target/name).resolve().is_relative_to(target.resolve()): raise ValueError("Invalid archive path.")
        zipped.extractall(target)
    homes=[p.parent.parent for p in target.glob("*/bin/java.exe")]
    if len(homes)!=1: raise ValueError("Ambiguous Java installation.")
    home=homes[0].resolve()
    (APP_ROOT/".local/java-home.txt").write_text(str(home),encoding="utf-8")
    print(str(home),flush=True)
if __name__=="__main__": setup()
