#!/bin/bash
# EstiMate Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: staging, production

set -e

ENV=${1:-staging}
echo "🚀 Starting deployment to $ENV..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verify environment
echo -e "${YELLOW}Verifying environment...${NC}"
if [ -f ".env.$ENV" ]; then
  echo -e "${GREEN}✓ Environment file found${NC}"
else
  echo -e "${RED}✗ Environment file .env.$ENV not found${NC}"
  exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run db:push

# Build application
echo -e "${YELLOW}Building application...${NC}"
NODE_ENV=production npm run build

# Verify build
echo -e "${YELLOW}Verifying build...${NC}"
if [ -f "dist/index.js" ] && [ -d "dist/public" ]; then
  echo -e "${GREEN}✓ Build successful${NC}"
  echo "  - Server: $(wc -c < dist/index.js) bytes"
  echo "  - Client: $(du -sh dist/public | cut -f1)"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi

# Run tests if not production
if [ "$ENV" != "production" ]; then
  echo -e "${YELLOW}Running tests...${NC}"
  npm test || echo -e "${YELLOW}⚠ Tests failed but continuing...${NC}"
fi

# Deploy based on environment
echo -e "${YELLOW}Deploying to $ENV...${NC}"

if [ "$ENV" == "staging" ]; then
  # Staging deployment (Vercel preview)
  if command -v vercel > /dev/null; then
    vercel --prebuilt
  else
    echo -e "${RED}✗ Vercel CLI not installed${NC}"
    exit 1
  fi
elif [ "$ENV" == "production" ]; then
  # Production deployment
  if command -v vercel > /dev/null; then
    vercel --prod --prebuilt
  else
    echo -e "${RED}✗ Vercel CLI not installed${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Unknown environment: $ENV${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Deployment complete!${NC}"
