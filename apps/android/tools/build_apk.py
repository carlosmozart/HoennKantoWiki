"""Compile the Android debug APK using the locally installed Android SDK."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
try:
    from .build_web import build, APP_ROOT
except ImportError:
    from build_web import build, APP_ROOT

def find_sdk():
    candidates=[os.environ.get("ANDROID_HOME"),os.environ.get("ANDROID_SDK_ROOT")]
    local=APP_ROOT/"android/local.properties"
    if local.is_file():
        match=re.search(r"^sdk\.dir=(.+)$",local.read_text(),re.M)
        if match: candidates.append(match[1].replace("\\:",":").replace("\\\\","\\"))
    candidates.append(str(Path(os.environ.get("LOCALAPPDATA",""))/"Android/Sdk"))
    for value in candidates:
        if value and (Path(value)/"platform-tools").is_dir(): return Path(value).resolve()
    raise SystemExit("Android SDK nao encontrado. Conclua o assistente inicial do Android Studio ou configure ANDROID_HOME.")

def find_java():
    local=APP_ROOT/".local/java-home.txt"
    candidates=[os.environ.get("JAVA_HOME")]
    if local.is_file(): candidates.append(local.read_text(encoding="utf-8").strip())
    candidates.append(str(Path(os.environ.get("ProgramFiles","C:/Program Files"))/"Android/Android Studio/jbr"))
    java_binary="java.exe" if os.name == "nt" else "java"
    for value in candidates:
        if not value: continue
        path=Path(value)
        if not (path/"bin"/java_binary).is_file() or not (path/"release").is_file(): continue
        match=re.search(r'JAVA_VERSION="(\d+)',(path/"release").read_text())
        if match and 21<=int(match[1])<=24: return path.resolve()
    raise SystemExit("JDK 21 compativel nao encontrado. Execute: python -B tools/setup_java.py")

def main():
    sdk=find_sdk()
    if not (sdk/"platforms/android-36/android.jar").is_file():
        print("Gradle verificara a plataforma API 36 e as licencas do SDK instalado.",flush=True)
    java=find_java()
    env=os.environ.copy()
    env["JAVA_HOME"]=str(java)
    env["ANDROID_HOME"]=str(sdk)
    (APP_ROOT/"android/local.properties").write_text("sdk.dir="+sdk.as_posix()+"\n",encoding="utf-8")
    build()
    subprocess.run(["node",str(APP_ROOT/"node_modules/@capacitor/cli/bin/capacitor"),"sync","android"],
                   cwd=APP_ROOT,env=env,stdin=subprocess.DEVNULL,check=True)
    if os.name == "nt":
        gradle=["cmd","/d","/c","gradlew.bat",":app:assembleDebug","--no-daemon"]
    else:
        wrapper=APP_ROOT/"android/gradlew"
        wrapper.chmod(wrapper.stat().st_mode | 0o111)
        gradle=["./gradlew",":app:assembleDebug","--no-daemon"]
    subprocess.run(gradle,cwd=APP_ROOT/"android",env=env,stdin=subprocess.DEVNULL,check=True)
    source=APP_ROOT/"android/app/build/outputs/apk/debug/app-debug.apk"
    version=json.loads((APP_ROOT/"package.json").read_text())["version"]
    target=APP_ROOT/"dist"/f"HoennKantoWiki-{version}-debug.apk"
    shutil.copy2(source,target)
    sha=hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix(".apk.sha256").write_text(sha+"  "+target.name+"\n")
    print(json.dumps({"apk":str(target),"bytes":target.stat().st_size,"sha256":sha},indent=2),flush=True)

if __name__=="__main__":
    try: main()
    except subprocess.CalledProcessError as error: raise SystemExit(error.returncode)
