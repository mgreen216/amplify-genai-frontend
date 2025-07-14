#!/bin/bash

echo "Quick Build and Start"
echo "===================="

# Clean and build
rm -rf .next
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "Starting on port 3006..."
    echo ""
    PORT=3006 npm run start
else
    echo "❌ Build failed"
    exit 1
fi