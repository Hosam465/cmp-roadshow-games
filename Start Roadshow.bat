@echo off
title Compliance Roadshow Games
cd /d "%~dp0"
if not exist node_modules (
  echo Installing for the first time...
  call npm install --no-fund --no-audit
)
node server.js
pause
