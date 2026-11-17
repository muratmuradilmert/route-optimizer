@echo off
rem Route Optimizer'i baslatir: yerel sunucuyu acar ve uygulamayi tarayicida gosterir.
cd /d "%~dp0"
start "" http://localhost:8765
node server.js
pause
