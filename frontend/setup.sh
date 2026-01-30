#!/bin/bash
# ServicePass Frontend Quick Setup Script for Linux/Mac

echo "================================"
echo "ServicePass Frontend Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo ""
echo "Dependencies installed successfully!"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit the .env file and configure:"
    echo "  - VITE_API_URL (your backend API URL)"
    echo ""
fi

echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To build for production, run:"
echo "  npm run build"
echo ""
