#!/bin/bash
# Startup wrapper for Nano Banana Engine
# Used by npm run dev:all

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "🍌 [ENGINE] Virtual Environment not found. Running installer..."
    chmod +x src/engine/install_engine.sh
    ./src/engine/install_engine.sh
fi

echo "🍌 [ENGINE] Activating Virtual Environment..."
source venv/bin/activate

echo "🍌 [ENGINE] Starting Python Server..."
python3 src/engine/server.py
