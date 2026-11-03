#!/bin/sh
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then (sleep 1; open http://localhost:8080) & node server.js
else echo "Node.js is not installed. Download it from https://nodejs.org (LTS), then run this file again."; read x; fi
