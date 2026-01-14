#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "======================================================"
echo " SmartPark Fullstack (Mac/Linux)"
echo " Backend:  http://localhost:8080"
echo " Frontend: http://localhost:5173"
echo "======================================================"
echo ""
echo "This script runs both servers in the current terminal."
echo "Press Ctrl+C to stop."
echo ""

# backend
( cd backend && ./RUN_BACKEND_MAC_LINUX.sh ) &
BE_PID=$!

# frontend
( cd frontend && ./RUN_MAC_LINUX.sh ) &
FE_PID=$!

trap 'echo; echo "Stopping..."; kill $BE_PID $FE_PID 2>/dev/null || true' INT TERM

wait
