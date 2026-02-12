#!/bin/bash

# Nano Banana Local Engine Installer
# Optimized for Mac Silicon (M1/M2/M3)

# Ensure we are in the project root
cd "$(dirname "$0")/../.."

# 1. Create Virtual Environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# 2. Activate
source venv/bin/activate

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install Torch with MPS support (Apple Silicon)
echo "Installing PyTorch with MPS support..."
pip install --pre torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/nightly/cpu

# 5. Install Dependencies
echo "Installing Engine Dependencies..."
pip install -r src/engine/requirements.txt

# 6. Success
echo ""
echo "✅ Engine Installed Successfully!"
echo "To run the server:"
echo "  source venv/bin/activate"
echo "  python server.py"
echo ""
