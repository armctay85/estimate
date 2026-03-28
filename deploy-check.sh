#!/bin/bash
# Deploy EstiMate to Vercel

echo "🚀 EstiMate Deployment Script"
echo "=============================="

# Check required env vars
check_env() {
  if [ -z "$1" ]; then
    echo "❌ Missing required environment variable: $2"
    return 1
  fi
  echo "✅ $2 is set"
  return 0
}

echo ""
echo "Checking environment variables..."
check_env "$DATABASE_URL" "DATABASE_URL" || exit 1
check_env "$JWT_SECRET" "JWT_SECRET" || exit 1
check_env "$SESSION_SECRET" "SESSION_SECRET" || exit 1
check_env "$STRIPE_SECRET_KEY" "STRIPE_SECRET_KEY" || exit 1

echo ""
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to https://vercel.com/new and import your repo"
echo "3. Add the environment variables above"
echo "4. Deploy!"
