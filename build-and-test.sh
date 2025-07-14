#!/bin/bash

echo "Building Holy Family University AI Platform..."
echo "========================================"

# Clean previous builds
echo "1. Cleaning previous builds..."
rm -rf .next

# Build the application
echo "2. Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "3. Starting production server on port 3006..."
    echo ""
    PORT=3006 npm run start
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi