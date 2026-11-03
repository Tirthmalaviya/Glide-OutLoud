@echo off
rem Wanderwild - start the local server and open the app in your browser
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto nonode
echo Starting Wanderwild... keep this window open while you play.
start "" http://localhost:8080
node server.js
pause
goto :eof
:nonode
echo.
echo Node.js is not installed.
echo Download the LTS version from https://nodejs.org, install it, then double-click this file again.
echo.
pause
