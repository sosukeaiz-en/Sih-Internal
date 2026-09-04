#!/bin/bash

# Terminate child processes when script exits
trap "kill 0" EXIT

echo "🚀 Starting FastAPI Backend..."
python3 api/app.py &

echo "⚡ Starting React/Vite Frontend..."
cd frontend && npm run dev &

wait
