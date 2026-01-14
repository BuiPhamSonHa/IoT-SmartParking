#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js not found. Please install Node.js LTS, then retry."
  exit 1
fi

echo "[1/2] Installing dependencies..."
npm install

echo
echo "[2/2] Starting Vite dev server..."
echo "Open: http://localhost:5173"
npm run dev
