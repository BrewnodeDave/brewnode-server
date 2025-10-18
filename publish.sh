#!/bin/bash

# NPM Publishing Helper Script for BrewNode Server
# This script helps prepare and publish the package to npm

set -e

echo "🍺 BrewNode Server - NPM Publishing Helper"
echo "=========================================="

# Check if we're logged into npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged into npm. Please run: npm login"
    exit 1
fi

# Check current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Run tests
echo "🧪 Running tests..."
npm test

# Build/lint check (if applicable)
echo "🔍 Checking for errors..."
if command -v eslint &> /dev/null; then
    echo "Running ESLint..."
    npx eslint . --ext .js --ignore-path .eslintignore || true
fi

# Check package contents
echo "📋 Checking package contents..."
npm pack --dry-run

# Ask for confirmation
read -p "🚀 Ready to publish? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish to npm
echo "🚀 Publishing to npm..."
npm publish --access public

echo "✅ Successfully published @brewnode/server@$CURRENT_VERSION"
echo "📖 View on npm: https://www.npmjs.com/package/@brewnode/server"
echo "🏠 GitHub: https://github.com/BrewnodeDave/brewnode-server"