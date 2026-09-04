@echo off
cd /d "%~dp0"
python -B tools/build_apk.py
pause
