#!/bin/bash

# EstiMate Deployment Script
echo "🏗️  Building EstiMate for production deployment..."

# Update browserslist data to avoid warnings
echo "📦 Updating browser compatibility data..."
npx update-browserslist-db@latest --silent || echo "Browserslist update skipped"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build frontend with optimizations
echo "⚡ Building frontend..."
NODE_ENV=production vite build --mode production

# Build backend
echo "🔧 Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

# Create start script for production
echo "🚀 Creating production start script..."
echo "#!/bin/bash
export NODE_ENV=production
node dist/index.js" > start.sh
chmod +x start.sh

echo "✅ Build completed successfully!"
echo "📝 To deploy: Click the Deploy button in Replit"
echo "🌐 Development URL: https://workspace.armctaylor.repl.co"