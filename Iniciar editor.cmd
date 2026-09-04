@echo off
cd /d "%~dp0"
python tools/local_editor.py --open
if errorlevel 1 pause
