@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\StartLocalTest.ps1" %*
endlocal
