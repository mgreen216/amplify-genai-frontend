#!/bin/bash

echo "Debug Build Script"
echo "=================="

# Set environment to production for build
export NODE_ENV=production

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf .next

# Try building with more verbose output
echo "Building with verbose output..."
npx next build

echo ""
echo "Build process completed. Check output above for errors."