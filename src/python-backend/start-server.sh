#!/bin/bash

# Script to start the FastAPI backend server

echo "Starting Vibe Learning FastAPI Backend..."

# Navigate to the backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
python app.py
