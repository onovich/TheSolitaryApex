@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\OpenOnlineTest.ps1" %*
endlocal
